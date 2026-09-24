# factacorp-sdk

TypeScript/JavaScript SDK for interacting with FACTA smart contracts and GPU compute endpoints on Robinhood Chain.

## Install

```bash
npm install factacorp-sdk ethers
```

## Usage

### Read protocol data

```typescript
import { FactaClient } from "factacorp-sdk";

const client = new FactaClient();

// Query on-chain counters
const stats = await client.getProtocolStats();
console.log("Completed jobs:", stats.totalJobsCompleted.toString());
console.log("Attestations:", stats.totalAttestationsVerified.toString());

// Check account balances
const bal = await client.getWalletBalances("0x000000000000000000000000000000000000dEaD");
console.log("USDG:", client.formatUSDG(bal.usdg));
console.log("FACTA:", client.formatFACTA(bal.facta));
```

### Off-chain GPU inference

```typescript
import { FactaClient } from "factacorp-sdk";

const client = new FactaClient();
const res = await client.computePrompt("Explain in 1 sentence what a GPU is.");

console.log("Answer:", res.answer);
console.log("Hardware:", res.metrics.hardware);
console.log("Tokens/s:", res.metrics.tokens_per_s);
```

### Submit and settle a compute job on-chain

Requires a Signer with real USDG and ETH on Robinhood Chain Mainnet:

```typescript
import { ethers } from "ethers";
import { FactaClient } from "factacorp-sdk";

const provider = new ethers.JsonRpcProvider("https://rpc.mainnet.chain.robinhood.com");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const client = new FactaClient({ runner: signer });

// Approves 1 USDG, deposits into ComputeEscrow, runs on GPU, and settles on-chain
const result = await client.executeCompute(
  "What is 12 times 12? Answer with just the number.",
  1
);

console.log("AI Answer:", result.settlement.answer);
console.log("Deposit tx:", client.explorerTxUrl(result.depositTxHash));
result.settlement.txs?.forEach((t) => {
  console.log(`${t.step}: ${t.url}`);
});
```

### Redeem FACTA compute receipts

Burn earned FACTA from the reward pool for compute hours:

```typescript
const receipt = await client.redeemFacta(100);
console.log("Redeem tx:", client.explorerTxUrl(receipt.hash));
```

## Mainnet Contracts (`Chain ID: 4663`)

| Contract | Address | Explorer |
|---|---|---|
| FACTA Token | `0x334E8a034Ac50407eF57850FD35c68528fdb6E58` | [rh-scan](https://rh-scan.com/address/0x334E8a034Ac50407eF57850FD35c68528fdb6E58) |
| ComputeEscrow v2 | `0x27ba7E362b95D8205d159a856e94d850F13A180e` | [rh-scan](https://rh-scan.com/address/0x27ba7E362b95D8205d159a856e94d850F13A180e) |
| FACTARewardPool v2 | `0x30B462c91127133E6BfC967351a5D3F3542c5106` | [rh-scan](https://rh-scan.com/address/0x30B462c91127133E6BfC967351a5D3F3542c5106) |
| TEEAttestationVerifier | `0xF7469d9274E2c4c8d5b091ffeDEA4A800eC19B43` | [rh-scan](https://rh-scan.com/address/0xF7469d9274E2c4c8d5b091ffeDEA4A800eC19B43) |
| GDAIntegration | `0x9655a0337C24F596AC7d2C450fa4b1B05afaA682` | [rh-scan](https://rh-scan.com/address/0x9655a0337C24F596AC7d2C450fa4b1B05afaA682) |
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | [rh-scan](https://rh-scan.com/address/0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168) |

## License

[MIT](LICENSE)
