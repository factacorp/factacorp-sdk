import {
  ContractRunner,
  ethers,
  formatEther,
  formatUnits,
  getAddress,
  JsonRpcProvider,
  parseEther,
  parseUnits,
  Signer,
} from "ethers";
import {
  DEFAULT_API_URL,
  MAINNET_CHAIN_ID,
  NETWORKS,
} from "./constants";
import {
  computeJobHash,
  createContracts,
  FactaContracts,
  parseOnChainJob,
} from "./contracts";
import {
  AttestationReport,
  ChainId,
  ComputeResponse,
  ContractsConfig,
  GPUClass,
  HistoryItem,
  NetworkConfig,
  OnChainJob,
  ProtocolStats,
  RunJobResult,
  WalletBalances,
} from "./types";

export interface FactaClientOptions {
  chainId?: ChainId;
  rpcUrl?: string;
  apiUrl?: string;
  runner?: ContractRunner;
  contracts?: Partial<ContractsConfig>;
}

export class FactaClient {
  public readonly chainId: ChainId;
  public readonly network: NetworkConfig;
  public readonly apiUrl: string;
  public runner: ContractRunner;
  public contracts: FactaContracts;

  constructor(options: FactaClientOptions = {}) {
    this.chainId = options.chainId || MAINNET_CHAIN_ID;
    const baseNetwork = NETWORKS[this.chainId];
    if (!baseNetwork) {
      throw new Error(`Unsupported chain ID: ${this.chainId}. Supported: 4663 (Mainnet), 46630 (Testnet)`);
    }

    const rpcUrl = options.rpcUrl || baseNetwork.rpcUrl;
    this.apiUrl = (options.apiUrl || DEFAULT_API_URL).replace(/\/$/, "");

    this.network = {
      ...baseNetwork,
      rpcUrl,
      contracts: {
        ...baseNetwork.contracts,
        ...(options.contracts || {}),
      },
    };

    this.runner =
      options.runner ||
      new JsonRpcProvider(this.network.rpcUrl, this.chainId, {
        staticNetwork: true,
      });

    this.contracts = createContracts(this.runner, this.network.contracts);
  }

  public setRunner(runner: ContractRunner): void {
    this.runner = runner;
    this.contracts = createContracts(this.runner, this.network.contracts);
  }

  private async requireSigner(): Promise<Signer> {
    if (!("getAddress" in this.runner && typeof (this.runner as any).signTransaction === "function")) {
      throw new Error("A Signer is required for state-modifying transactions. Provide a Signer in client options or setRunner().");
    }
    return this.runner as Signer;
  }

  public async getProtocolStats(): Promise<ProtocolStats> {
    const [supply, deposited, completed, attestations] = await Promise.all([
      this.contracts.factaToken.totalSupply().catch(() => 0n),
      this.contracts.escrow.totalJobsDeposited().catch(() => 0n),
      this.contracts.escrow.totalJobsCompleted().catch(() => 0n),
      this.contracts.verifier.totalAttestationsVerified().catch(() => 0n),
    ]);

    let poolBalance: bigint | undefined;
    let rewardPerJob: bigint | undefined;
    if (this.contracts.rewardPool) {
      poolBalance = await this.contracts.rewardPool.poolBalance().catch(() => 0n);
      rewardPerJob = await this.contracts.rewardPool.rewardPerJob().catch(() => 0n);
    }

    const unallocatedHolderYield = await this.contracts.gda.unallocated().catch(() => 0n);

    return {
      factaSupply: supply,
      totalJobsDeposited: deposited,
      totalJobsCompleted: completed,
      totalAttestationsVerified: attestations,
      poolBalance,
      rewardPerJob,
      unallocatedHolderYield,
    };
  }

  public async getJob(jobHash: string): Promise<OnChainJob> {
    const raw = await this.contracts.escrow.jobs(jobHash);
    return parseOnChainJob(raw);
  }

  public async getWalletBalances(accountAddress?: string): Promise<WalletBalances> {
    let address = accountAddress;
    if (!address && "getAddress" in this.runner) {
      address = await (this.runner as any).getAddress();
    }
    if (!address) {
      throw new Error("No address provided and runner is not an authenticated Signer.");
    }

    address = getAddress(address);
    const provider = "provider" in this.runner && this.runner.provider
      ? this.runner.provider
      : (this.runner as any);

    const [eth, usdg, facta, claimableYield, collateral] = await Promise.all([
      provider.getBalance ? provider.getBalance(address).catch(() => 0n) : 0n,
      this.contracts.usdg.balanceOf(address).catch(() => 0n),
      this.contracts.factaToken.balanceOf(address).catch(() => 0n),
      this.contracts.gda.claimable(address).catch(() => 0n),
      this.contracts.verifier.providerCollateral(address).catch(() => 0n),
    ]);

    return { eth, usdg, facta, claimableYield, collateral };
  }

  public async getJobHistory(address: string): Promise<HistoryItem[]> {
    const res = await fetch(`${this.apiUrl}/api/history?address=${getAddress(address)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch history (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.items || [];
  }

  public async computePrompt(prompt: string, gpuClass: GPUClass = GPUClass.H100): Promise<ComputeResponse> {
    const res = await fetch(`${this.apiUrl}/api/compute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, gpu_class: gpuClass }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `Compute request failed with HTTP ${res.status}`);
    }
    return data as ComputeResponse;
  }

  public async settleJob(jobHash: string, prompt?: string): Promise<RunJobResult> {
    const res = await fetch(`${this.apiUrl}/api/run-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobHash, prompt }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        success: false,
        status: data.status || "Failed",
        error: data.error || `Settlement failed with HTTP ${res.status}`,
      };
    }
    return data as RunJobResult;
  }

  public async approveUSDG(amountUSDG: number | bigint = 1): Promise<ethers.ContractTransactionReceipt> {
    await this.requireSigner();
    const amount = typeof amountUSDG === "bigint" ? amountUSDG : parseUnits(amountUSDG.toString(), 6);
    const tx = await this.contracts.usdg.approve(this.network.contracts.ComputeEscrow, amount);
    return await tx.wait();
  }

  public async depositJob(
    prompt: string,
    paymentUSDG: number | bigint = 1,
    gpuClass: GPUClass = GPUClass.H100
  ): Promise<{
    jobHash: string;
    jobSpecHash: string;
    receipt: ethers.ContractTransactionReceipt;
  }> {
    const signer = await this.requireSigner();
    const customer = await signer.getAddress();
    const payment = typeof paymentUSDG === "bigint" ? paymentUSDG : parseUnits(paymentUSDG.toString(), 6);

    const allowance: bigint = await this.contracts.usdg.allowance(customer, this.network.contracts.ComputeEscrow);
    if (allowance < payment) {
      const approveTx = await this.contracts.usdg.approve(this.network.contracts.ComputeEscrow, payment);
      await approveTx.wait();
    }

    const { jobHash, jobSpecHash } = computeJobHash(customer, prompt);
    const tx = await this.contracts.escrow.depositJob(jobHash, jobSpecHash, payment, gpuClass);
    const receipt = await tx.wait();

    return { jobHash, jobSpecHash, receipt };
  }

  public async executeCompute(
    prompt: string,
    paymentUSDG: number | bigint = 1,
    gpuClass: GPUClass = GPUClass.H100
  ): Promise<{
    jobHash: string;
    jobSpecHash: string;
    depositTxHash: string;
    settlement: RunJobResult;
  }> {
    const { jobHash, jobSpecHash, receipt } = await this.depositJob(prompt, paymentUSDG, gpuClass);
    const settlement = await this.settleJob(jobHash, prompt);
    return {
      jobHash,
      jobSpecHash,
      depositTxHash: receipt.hash,
      settlement,
    };
  }

  public async redeemFacta(amountFacta: number | bigint): Promise<ethers.ContractTransactionReceipt> {
    await this.requireSigner();
    if (!this.contracts.rewardPool) {
      throw new Error("RewardPool is not deployed on this network; redeem via token directly.");
    }
    const amount = typeof amountFacta === "bigint" ? amountFacta : parseEther(amountFacta.toString());
    const signer = await this.requireSigner();
    const owner = await signer.getAddress();

    const poolAddr = this.network.contracts.FACTARewardPool!;
    const allowance: bigint = await this.contracts.factaToken.allowance(owner, poolAddr);
    if (allowance < amount) {
      const appTx = await this.contracts.factaToken.approve(poolAddr, amount);
      await appTx.wait();
    }

    const tx = await this.contracts.rewardPool.redeem(amount);
    return await tx.wait();
  }

  public async claimHolderRevenue(): Promise<ethers.ContractTransactionReceipt> {
    await this.requireSigner();
    const tx = await this.contracts.gda.claim();
    return await tx.wait();
  }

  public async depositCollateral(amountEth: number | bigint): Promise<ethers.ContractTransactionReceipt> {
    await this.requireSigner();
    const value = typeof amountEth === "bigint" ? amountEth : parseEther(amountEth.toString());
    const tx = await this.contracts.verifier.depositCollateral({ value });
    return await tx.wait();
  }

  public async withdrawCollateral(amountEth: number | bigint): Promise<ethers.ContractTransactionReceipt> {
    await this.requireSigner();
    const amount = typeof amountEth === "bigint" ? amountEth : parseEther(amountEth.toString());
    const tx = await this.contracts.verifier.withdrawCollateral(amount);
    return await tx.wait();
  }

  public formatUSDG(amount: bigint): string {
    return formatUnits(amount, 6);
  }

  public formatFACTA(amount: bigint): string {
    return formatEther(amount);
  }

  public explorerTxUrl(txHash: string): string {
    return `${this.network.explorerUrl}/tx/${txHash}`;
  }

  public explorerAddressUrl(address: string): string {
    return `${this.network.explorerUrl}/address/${address}`;
  }
}
