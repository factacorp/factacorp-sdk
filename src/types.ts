export type ChainId = 4663 | 46630;

export enum GPUClass {
  H100 = 0,
  H200 = 1,
  B200 = 2,
}

export enum VerificationLevel {
  TEE = 0,
  TEE_ZK = 1,
}

export type JobStatusName =
  | "None"
  | "Deposited"
  | "Assigned"
  | "Completed"
  | "Refunded"
  | "Cancelled";

export interface ContractsConfig {
  FACTAToken: string;
  ComputeEscrow: string;
  TEEAttestationVerifier: string;
  GDAIntegration: string;
  USDG: string;
  FACTARewardPool?: string;
}

export interface NetworkConfig {
  chainId: ChainId;
  chainName: string;
  isMainnet: boolean;
  rpcUrl: string;
  explorerUrl: string;
  contracts: ContractsConfig;
  deployer?: string;
  treasury?: string;
  operator?: string;
  deployBlock?: number;
  logsRpcUrl?: string;
}

export interface OnChainJob {
  customer: string;
  provider: string;
  payment: bigint;
  gpuSeconds: bigint;
  gpuClass: number;
  verificationLevel: number;
  status: JobStatusName;
  statusCode: number;
  depositedAt: bigint;
  assignedAt: bigint;
  jobHash: string;
  attestationHash: string;
}

export interface AttestationReport {
  jobHash: string;
  resultHash: string;
  nonce: string;
  gpuModel: string;
  gpuSeconds: number;
  gpuClass: number;
  timestamp: number;
}

export interface AttestationData {
  attestationHash: string;
  signature: string;
  signer: string;
}

export interface ComputeMetrics {
  gpu_model: string;
  gpu_class: number;
  gpu_seconds: number;
  execution_ms: number;
  tflops?: number;
  llm_model?: string;
  tokens?: number;
  tokens_per_s?: number;
  hardware: string;
}

export interface ComputeResponse {
  status: string;
  protocol: string;
  output: string;
  answer?: string;
  metrics: ComputeMetrics;
  report: AttestationReport;
  attestation: AttestationData;
}

export interface SettlementTx {
  step: string;
  hash: string;
  block: number;
  url: string;
}

export interface RunJobResult {
  success: boolean;
  status: string;
  provider?: string;
  payment?: string;
  output?: string;
  answer?: string;
  metrics?: ComputeMetrics;
  attestation?: AttestationData;
  txs?: SettlementTx[];
  alreadyCompleted?: boolean;
  error?: string;
}

export interface HistoryItem {
  action: string;
  hash: string;
  block: number;
  timestamp: number | null;
  status: string;
  source?: string;
}

export interface ProtocolStats {
  factaSupply: bigint;
  totalJobsDeposited: bigint;
  totalJobsCompleted: bigint;
  totalAttestationsVerified: bigint;
  poolBalance?: bigint;
  rewardPerJob?: bigint;
  unallocatedHolderYield?: bigint;
}

export interface WalletBalances {
  eth: bigint;
  usdg: bigint;
  facta: bigint;
  claimableYield?: bigint;
  collateral?: bigint;
}
