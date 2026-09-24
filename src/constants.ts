import { NetworkConfig } from "./types";

export const MAINNET_CHAIN_ID = 4663;
export const TESTNET_CHAIN_ID = 46630;

export const DEFAULT_API_URL = "https://www.factacorp.io";

export const NETWORKS: Record<number, NetworkConfig> = {
  [MAINNET_CHAIN_ID]: {
    chainId: MAINNET_CHAIN_ID,
    chainName: "Robinhood Chain",
    isMainnet: true,
    rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
    logsRpcUrl: "https://rpc.mainnet.chain.robinhood.com",
    explorerUrl: "https://rh-scan.com",
    deployBlock: 70746699,
    contracts: {
      FACTAToken: "0x334E8a034Ac50407eF57850FD35c68528fdb6E58",
      FACTARewardPool: "0x30B462c91127133E6BfC967351a5D3F3542c5106",
      ComputeEscrow: "0x27ba7E362b95D8205d159a856e94d850F13A180e",
      TEEAttestationVerifier: "0xF7469d9274E2c4c8d5b091ffeDEA4A800eC19B43",
      GDAIntegration: "0x9655a0337C24F596AC7d2C450fa4b1B05afaA682",
      USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    },
    treasury: "0x060a77d077fD5d72De972AC9AF35ae7B0BB8a96d",
    operator: "0x060a77d077fD5d72De972AC9AF35ae7B0BB8a96d",
  },
  [TESTNET_CHAIN_ID]: {
    chainId: TESTNET_CHAIN_ID,
    chainName: "Robinhood Chain Testnet",
    isMainnet: false,
    rpcUrl: "https://testnet.rpc.robinhoodchain.com",
    logsRpcUrl: "https://testnet.rpc.robinhoodchain.com",
    explorerUrl: "https://explorer.testnet.chain.robinhood.com",
    contracts: {
      FACTAToken: "0x9F1bF5Aab4CFAAED2E56dc5A52d44929441147CB",
      ComputeEscrow: "0x8Fcc684C7a9C59509764A08760B6681830d0677a",
      TEEAttestationVerifier: "0xbFd8a54dF64BAB223265A6665243D0Ee2b208147",
      GDAIntegration: "0x7CC8271Aaa81FD176E2A55510b63a5E4B17e5cfe",
      USDG: "0xbB68762E2a085Cc8727D8836220DE1545e4Cff8e",
    },
  },
};

export const STATUS_NAMES = [
  "None",
  "Deposited",
  "Assigned",
  "Completed",
  "Refunded",
  "Cancelled",
] as const;

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

export const COMPUTE_ESCROW_ABI = [
  "function depositJob(bytes32 jobHash, bytes32 jobSpecHash, uint256 payment, uint8 gpuClass) external",
  "function assignProvider(bytes32 jobHash, address provider) external",
  "function verifyAndRelease(bytes32 jobHash, bytes32 attestationHash, uint256 gpuSeconds, uint8 verificationLevel) external",
  "function cancelJob(bytes32 jobHash) external",
  "function refundJob(bytes32 jobHash) external",
  "function jobs(bytes32) view returns (address customer, address provider, uint256 payment, uint256 gpuSeconds, uint8 gpuClass, uint8 verificationLevel, uint8 status, uint256 depositedAt, uint256 assignedAt, bytes32 jobHash, bytes32 attestationHash)",
  "function totalJobsDeposited() view returns (uint256)",
  "function totalJobsCompleted() view returns (uint256)",
  "function paused() view returns (bool)",
  "function usdg() view returns (address)",
  "function factaToken() view returns (address)",
  "function gdaIntegration() view returns (address)",
  "function treasury() view returns (address)",
  "event JobDeposited(bytes32 indexed jobHash, address indexed customer, uint256 payment, bytes32 jobSpecHash, uint8 gpuClass)",
  "event JobAssigned(bytes32 indexed jobHash, address indexed provider)",
  "event JobVerified(bytes32 indexed jobHash, bytes32 attestationHash, uint256 gpuSeconds, uint256 providerPayout, uint256 holderPayout, uint256 treasuryPayout)",
  "event JobRefunded(bytes32 indexed jobHash, address indexed customer, uint256 amount)",
  "event JobCancelled(bytes32 indexed jobHash, address indexed customer)",
];

export const REWARD_POOL_ABI = [
  "function poolBalance() view returns (uint256)",
  "function rewardPerJob() view returns (uint256)",
  "function rewardPerGpuSecond() view returns (uint256)",
  "function rewardFor(uint256 gpuSeconds, uint8 gpuClass, uint8 level) view returns (uint256)",
  "function redeem(uint256 amount) external",
  "function setRewardPerJob(uint256 amount) external",
  "function totalComputeVerified() view returns (uint256)",
  "function totalRewarded() view returns (uint256)",
  "function totalShortfall() view returns (uint256)",
  "function totalRedeemed() view returns (uint256)",
  "function redemptionResolver() view returns (address)",
  "event ComputeVerified(address indexed provider, uint256 gpuSeconds, uint8 gpuClass, uint8 verificationLevel, bytes32 indexed attestationHash, uint256 rewardAmount)",
  "event RewardShortfall(address indexed provider, bytes32 indexed attestationHash, uint256 owed, uint256 paid)",
  "event Redeemed(address indexed holder, uint256 amount, uint256 gpuCreditSeconds)",
  "event RewardRateUpdated(uint256 oldRate, uint256 newRate)",
  "event RewardPerJobUpdated(uint256 oldAmount, uint256 newAmount)",
];

export const VERIFIER_ABI = [
  "function verifyAttestation((bytes32 jobHash, bytes32 resultHash, bytes32 nonce, bytes32 gpuModel, uint256 gpuSeconds, uint8 gpuClass, uint256 timestamp) report, bytes signature) external returns (bool)",
  "function providerCollateral(address) view returns (uint256)",
  "function depositCollateral() external payable",
  "function withdrawCollateral(uint256 amount) external",
  "function allowedGpuModels(bytes32) view returns (bool)",
  "function nrasPublicKey() view returns (address)",
  "function totalAttestationsVerified() view returns (uint256)",
  "event AttestationVerified(bytes32 indexed jobHash, address indexed provider, bytes32 resultHash, bytes32 nonce, bytes32 gpuModel, uint256 gpuSeconds, uint8 gpuClass)",
  "event CollateralDeposited(address indexed provider, uint256 amount)",
  "event CollateralWithdrawn(address indexed provider, uint256 amount)",
];

export const GDA_ABI = [
  "function claim() external returns (uint256)",
  "function claimable(address account) view returns (uint256)",
  "function unallocated() view returns (uint256)",
  "function totalDistributed() view returns (uint256)",
  "function holderUnits(address account) view returns (uint256)",
  "function totalUnits() view returns (uint256)",
  "event RevenueDistributed(uint256 amount, uint256 perUnitRate)",
  "event RevenueClaimed(address indexed holder, uint256 amount)",
  "event RevenueHeld(uint256 amount)",
];
