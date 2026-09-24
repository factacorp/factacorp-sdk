import { Contract, ContractRunner, ethers, getAddress, keccak256, toUtf8Bytes, ZeroAddress } from "ethers";
import {
  COMPUTE_ESCROW_ABI,
  ERC20_ABI,
  GDA_ABI,
  REWARD_POOL_ABI,
  STATUS_NAMES,
  VERIFIER_ABI,
} from "./constants";
import { ContractsConfig, OnChainJob } from "./types";

export interface FactaContracts {
  usdg: Contract;
  factaToken: Contract;
  escrow: Contract;
  verifier: Contract;
  gda: Contract;
  rewardPool?: Contract;
}

export function createContracts(
  runner: ContractRunner,
  config: ContractsConfig
): FactaContracts {
  const usdg = new Contract(getAddress(config.USDG), ERC20_ABI, runner);
  const factaToken = new Contract(getAddress(config.FACTAToken), ERC20_ABI, runner);
  const escrow = new Contract(getAddress(config.ComputeEscrow), COMPUTE_ESCROW_ABI, runner);
  const verifier = new Contract(getAddress(config.TEEAttestationVerifier), VERIFIER_ABI, runner);
  const gda = new Contract(getAddress(config.GDAIntegration), GDA_ABI, runner);
  const rewardPool = config.FACTARewardPool
    ? new Contract(getAddress(config.FACTARewardPool), REWARD_POOL_ABI, runner)
    : undefined;

  return { usdg, factaToken, escrow, verifier, gda, rewardPool };
}

export function computeJobSpecHash(prompt: string): string {
  return keccak256(toUtf8Bytes(prompt));
}

export function computeJobHash(
  customerAddress: string,
  prompt: string,
  nonce: number | bigint = Date.now()
): { jobHash: string; jobSpecHash: string } {
  const jobSpecHash = computeJobSpecHash(prompt);
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bytes32", "uint256"],
    [getAddress(customerAddress), jobSpecHash, BigInt(nonce)]
  );
  return {
    jobHash: keccak256(encoded),
    jobSpecHash,
  };
}

export function parseOnChainJob(raw: any): OnChainJob {
  const statusCode = Number(raw.status ?? raw[6] ?? 0);
  const status = STATUS_NAMES[statusCode] || "None";
  return {
    customer: raw.customer ?? raw[0],
    provider: raw.provider ?? raw[1] ?? ZeroAddress,
    payment: BigInt(raw.payment ?? raw[2] ?? 0),
    gpuSeconds: BigInt(raw.gpuSeconds ?? raw[3] ?? 0),
    gpuClass: Number(raw.gpuClass ?? raw[4] ?? 0),
    verificationLevel: Number(raw.verificationLevel ?? raw[5] ?? 0),
    status,
    statusCode,
    depositedAt: BigInt(raw.depositedAt ?? raw[7] ?? 0),
    assignedAt: BigInt(raw.assignedAt ?? raw[8] ?? 0),
    jobHash: raw.jobHash ?? raw[9],
    attestationHash: raw.attestationHash ?? raw[10],
  };
}
