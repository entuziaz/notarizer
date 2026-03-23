# Rootstock Content Notarization Tool

A minimal authorship timestamping system for Rootstock Testnet.

The current repository includes:
- an ownerless, non-upgradeable Solidity contract
- a Hardhat 3 deployment and verification workflow
- a Mocha/Chai test suite
- a Next.js app scaffold for the frontend that will consume the deployed contract

The intended product is simple: hash content client-side, anchor the hash on Rootstock in one transaction, and later verify that the same content existed on-chain by a given point in time.

## What This Proves

This system proves:
- a specific `bytes32` hash was anchored on Rootstock Testnet
- the first anchor happened at a specific block number
- a specific wallet submitted that first anchor

This system does not prove:
- legal authorship in an absolute sense
- ownership of plaintext content without the original file/text
- anything about content that hashes differently because of formatting or byte-level changes

The correct claim is: this is a proof-of-existence and claimed-authorship timestamping tool.

## Design Principles

The contract is intentionally minimal.

- No owner
- No admin key
- No upgradeability
- No mutable policy controls
- One hash can only be anchored once globally
- Contract events are the primitive for wallet history and explorer links


## Contract Design

Contract: `contracts/Notarize.sol`

State:
- `mapping(bytes32 => address) public notarizers`
- `mapping(bytes32 => uint256) public firstBlockNumbers`

Event:
- `Notarized(bytes32 indexed hash, address indexed notarizer, uint256 blockNumber)`

Rule set:
- `notarize(bytes32 hash)` reverts if the hash was already anchored
- `bytes32(0)` is rejected as a sentinel value
- the first write stores the sender and the current block number

Why `blockNumber` instead of `block.timestamp`:
- the block number is the clean on-chain anchor
- the exact timestamp can be derived off-chain from the block
- transaction hash and history naturally come from explorer logs and events

## Hashing Rules

These rules matter because inconsistent hashing silently breaks verification.

- Files should be hashed as raw bytes
- Text should be hashed as exact UTF-8 bytes
- Do not `trim()` input before hashing
- Do not normalize whitespace or line endings unless explicitly documented

Two users only get the same hash if they hash the exact same bytes.

## Deployment Status

The contract is already deployed and verified on Rootstock Testnet.

- Network: Rootstock Testnet
- Chain ID: `31`
- Contract address: `0xc2d018fAe55e8A4524cBD93fc8B3A9a25AbBD885`
- Deployment transaction: `0x99fd2868d3684883f9885415a1733edfa65a962b8d4929bd9f96fac30dc1c4b9`
- Verified explorer page: [Rootstock Testnet Blockscout](https://rootstock-testnet.blockscout.com/address/0xc2d018fAe55e8A4524cBD93fc8B3A9a25AbBD885#code)

## Tech Stack

- Solidity `0.8.20`
- Hardhat `3`
- Ethers `6`
- Mocha + Chai
- Next.js `16`
- React `19`

## Environment Variables

Use `.env.example` as the template.

Required variables:

```env
ROOTSTOCK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
PRIVATE_KEY=your_testnet_private_key
NEXT_PUBLIC_NOTARIZE_CONTRACT_ADDRESS=0xc2d018fAe55e8A4524cBD93fc8B3A9a25AbBD885
```

Notes:
- use a dedicated testnet wallet only
- never commit the real `.env`
- `NEXT_PUBLIC_NOTARIZE_CONTRACT_ADDRESS` will be used by the frontend

## Local Setup

Install dependencies:

```bash
pnpm install
```

Copy the env template and fill in your values:

```bash
cp .env.example .env
```

## Available Scripts

Frontend:

```bash
pnpm dev
pnpm build
pnpm start
```

Contract workflow:

```bash
pnpm contracts:compile
pnpm contracts:test
pnpm contracts:deploy:testnet
pnpm contracts:verify:testnet -- <contract_address>
```

Project hygiene:

```bash
pnpm lint
pnpm exec tsc --noEmit
```

## Test Coverage

Test file: `test/Notarize.ts`

Current tests cover:
- stores first notarization details correctly
- emits the `Notarized` event
- rejects duplicate notarization from the same wallet
- rejects duplicate notarization from a different wallet
- returns empty values for an unknown hash
- rejects the zero-hash sentinel

## Deployment Workflow

1. Fund a Rootstock Testnet wallet with `tRBTC`
2. Set `ROOTSTOCK_TESTNET_RPC_URL` and `PRIVATE_KEY` in `.env`
3. Deploy:

```bash
pnpm contracts:deploy:testnet
```

4. Verify on Blockscout:

```bash
pnpm contracts:verify:testnet -- <contract_address>
```

## Current Scope

Completed:
- smart contract
- test suite
- Rootstock Testnet deployment
- verified contract on Blockscout
- project setup for the frontend

Not completed yet:
- `/notarize` page
- `/verify/[hash]` page
- `/history` page
- wallet connection UX
- client-side hashing UI

This is intentional. The repository currently prioritizes the on-chain system and verification workflow first.

## Security Notes

- never expose raw content to a server when hashing can happen client-side
- use a dedicated testnet private key
- do not promise legal certainty beyond cryptographic timestamping
- do not add upgradeability or admin controls unless the trust model changes intentionally

## Next Step

The next build phase is the frontend:
- `/notarize`
- `/verify/[hash]`
- `/history`

Those views should use the deployed contract address above and keep hashing entirely in the browser.
