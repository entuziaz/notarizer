# Rootstock Content Notarization Tool

A minimal Rootstock Testnet dApp for proof-of-existence timestamping.

The app hashes text or file bytes entirely in the browser, anchors the resulting `bytes32` fingerprint on Rootstock in a single transaction, and lets anyone verify whether that exact hash was recorded first on-chain.

<img width="1403" height="693" alt="Screenshot 2026-03-25 at 23 52 15" src="https://github.com/user-attachments/assets/2e36d1d8-1ef5-40d9-8ac8-207e8d309be5" /> 

## What Is In This Repo

- an ownerless, non-upgradeable Solidity contract
- a Hardhat 3 deployment and verification workflow
- a Mocha/Chai contract test suite
- a working Next.js frontend with notarize, verify, and wallet-history views
- Rootstock Testnet integration using the deployed and verified contract

## Live Contract

- Network: Rootstock Testnet
- Chain ID: `31`
- Contract address: `0xc2d018fAe55e8A4524cBD93fc8B3A9a25AbBD885`
- Deployment block: `7479204`
- Deployment transaction: `0x99fd2868d3684883f9885415a1733edfa65a962b8d4929bd9f96fac30dc1c4b9`
- Verified explorer page: [Rootstock Testnet Blockscout](https://rootstock-testnet.blockscout.com/address/0xc2d018fAe55e8A4524cBD93fc8B3A9a25AbBD885#code)

## What This Proves

This system proves:

- a specific `bytes32` hash was anchored on Rootstock Testnet
- the first anchor happened at a specific block number and timestamp
- a specific wallet submitted that first anchor

This system does not prove:

- legal authorship in an absolute sense
- ownership of plaintext content without the original file or text
- anything about content that hashes differently because of byte-level changes

The accurate claim is: this is a proof-of-existence and claimed-authorship timestamping tool.

## Design Principles

- No owner
- No admin key
- No upgradeability
- No mutable policy controls
- One hash can only be anchored once globally
- Hashing happens client-side
- History comes from emitted events, not a second on-chain index

## Contract Design

Contract: `contracts/Notarize.sol`

State:

- `mapping(bytes32 => address) public notarizers`
- `mapping(bytes32 => uint256) public firstBlockNumbers`

Event:

- `Notarized(bytes32 indexed hash, address indexed notarizer, uint256 blockNumber)`

Rules:

- `notarize(bytes32 hash)` reverts if the hash has already been anchored
- `bytes32(0)` is rejected
- the first successful write stores the sender and the current block number

Why `blockNumber` instead of `block.timestamp`:

- block number is the clean on-chain anchor
- timestamp can be derived off-chain from the block
- tx history and proof links naturally come from explorer logs and receipts

## Hashing Rules

These rules are intentionally strict because inconsistent hashing silently breaks verification.

- files are hashed as raw bytes
- text is hashed as exact UTF-8 bytes
- the app does not `trim()` input
- the app does not normalize whitespace or line endings

Two users only get the same hash if they hash the exact same bytes.

## Frontend Routes

The frontend is live in this repository and is intentionally kept to a small number of views.

### `/`

Landing page with:

- contract and deployment overview
- wallet control
- direct links to notarize, verify, and history

### `/notarize`

Primary authoring flow:

- paste text or upload a file
- generate a `keccak256` hash locally in the browser
- connect a wallet or switch to Rootstock Testnet
- submit one transaction to anchor the hash
- receive a proof card with:
  - hash
  - tx hash
  - block number
  - resolved block timestamp
  - notarizer address
  - explorer links
  - shareable verify route

### `/verify/[hash]`

Verification flow:

- load a canonical proof route for a specific hash
- read `notarizers(hash)` and `firstBlockNumbers(hash)` from the contract
- resolve timestamp from chain data
- recover transaction details from indexed explorer logs
- re-hash pasted text or uploaded files locally and compare against the route hash

### `/history`

Wallet timeline flow:

- connect a Rootstock Testnet wallet
- load all `Notarized` events tied to that wallet
- show each hash, block number, timestamp, tx hash, and notarizer

## Wallet UX

The shared wallet control in the top-right corner supports:

- connect wallet
- wrong-network detection
- switch to Rootstock Testnet
- copy address
- explorer link
- local app-level disconnect

Note: browser wallets such as MetaMask generally do not let the dApp force a full permission-level disconnect. The app disconnect clears its own local session; revoking site permissions still happens in the wallet extension.


## Tech Stack

- Solidity `0.8.20`
- Hardhat `3`
- Ethers `6`
- Mocha + Chai
- Next.js `16`
- React `19`

## Environment Variables

Use [`.env.example`](/Users/jheikhei/small/notorizer/.env.example) as the template.

Required variables:

```env
ROOTSTOCK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
PRIVATE_KEY=your_testnet_private_key
NEXT_PUBLIC_NOTARIZE_CONTRACT_ADDRESS=0xc2d018fAe55e8A4524cBD93fc8B3A9a25AbBD885
NEXT_PUBLIC_ROOTSTOCK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
NEXT_PUBLIC_ROOTSTOCK_TESTNET_EXPLORER_BASE_URL=https://rootstock-testnet.blockscout.com
NEXT_PUBLIC_NOTARIZE_DEPLOYMENT_BLOCK=7479204
```

Notes:

- use a dedicated testnet wallet only
- never commit the real `.env`
- the frontend reads the public `NEXT_PUBLIC_*` values directly in the browser

## Local Setup

Install dependencies:

```bash
pnpm install
```

Copy the env template and fill in your values:

```bash
cp .env.example .env
```

Run the app:

```bash
pnpm dev
```

Production preview:

```bash
pnpm build
pnpm start
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

## Contract Test Coverage

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

## Security Notes

- raw content should never leave the browser for hashing
- use a dedicated testnet private key
- do not promise legal certainty beyond cryptographic timestamping
- do not add upgradeability or admin controls unless the trust model changes intentionally
- unsalted hashes can be copied from the mempool before confirmation, so the current design is proof-of-existence, not anti-front-running authorship enforcement
- short or predictable content may be guessable from a public hash

## Current Status

Completed:

- smart contract
- test suite
- Rootstock Testnet deployment
- verified contract on Blockscout
- working frontend routes
- shared wallet control
- client-side hashing flow
- verification route
- wallet history view
