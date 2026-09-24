# Security Policy

The FACTA Protocol team takes security seriously. We welcome security researchers and developers to audit, review, and responsibly disclose any vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in the FACTA SDK, backend services, or on-chain contracts:

1. **Do not disclose it publicly** or create public GitHub issues.
2. Email full technical details, proof-of-concept steps, and potential impact to:
   - **`contact@factacorp.io`**
3. We acknowledge receipt within **24 hours** and provide regular triage updates.

## Scope

- Smart contracts on Robinhood Chain Mainnet (`ComputeEscrow`, `FACTARewardPool`, `TEEAttestationVerifier`, `GDAIntegration`)
- FACTA SDK library (`@factacorp/sdk`)
- Verification and attestation relays

## Best Practices for SDK Users

- **Never hardcode private keys or secrets** in client-side code, git repositories, or frontend bundles.
- Use secure environment variables (`process.env.PRIVATE_KEY`) or browser wallet providers (`window.ethereum`).
- In production, separate admin, deployer, treasury, and operator roles using multi-signature wallets (e.g. Safe).
