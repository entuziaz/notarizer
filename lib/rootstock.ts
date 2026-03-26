import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  id,
  zeroPadValue,
  type Eip1193Provider,
  type Signer,
} from "ethers";

import { notarizeAbi } from "@/lib/contracts/notarizeAbi";
import {
  notarizeContractAddress,
  notarizeDeploymentBlock,
  rootstockTestnetBlockscoutApiBaseUrl,
  rootstockTestnetChainId,
  rootstockTestnetExplorerBaseUrl,
  rootstockTestnetRpcUrl,
} from "@/lib/contracts/notarizeConfig";
import { normalizeHash } from "@/lib/hash";

type InjectedProvider = Eip1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }
}

let readonlyProvider: JsonRpcProvider | null = null;
const notarizedEventTopic = id(
  "Notarized(bytes32,address,uint256)",
);

export type NotarizationRecord = {
  hash: string;
  notarizer: string;
  blockNumber: number;
  timestamp: number | null;
  txHash: string | null;
};

export type WalletHistoryEntry = {
  hash: string;
  notarizer: string;
  blockNumber: number;
  timestamp: number | null;
  txHash: string;
};

export { rootstockTestnetChainId, rootstockTestnetExplorerBaseUrl };

export function getReadonlyProvider(): JsonRpcProvider {
  if (readonlyProvider === null) {
    readonlyProvider = new JsonRpcProvider(rootstockTestnetRpcUrl, {
      chainId: rootstockTestnetChainId,
      name: "rootstock-testnet",
    });
  }

  return readonlyProvider;
}

export function getBrowserProvider(): InjectedProvider | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.ethereum ?? null;
}

export async function ensureRootstockTestnet(
  provider: InjectedProvider,
): Promise<BrowserProvider> {
  const browserProvider = new BrowserProvider(provider);
  const network = await browserProvider.getNetwork();

  if (Number(network.chainId) === rootstockTestnetChainId) {
    return browserProvider;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x1f" }],
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x1f",
          chainName: "Rootstock Testnet",
          nativeCurrency: {
            name: "Test RBTC",
            symbol: "tRBTC",
            decimals: 18,
          },
          rpcUrls: [rootstockTestnetRpcUrl],
          blockExplorerUrls: [rootstockTestnetExplorerBaseUrl],
        },
      ],
    });
  }

  return new BrowserProvider(provider);
}

export function getWritableContract(signer: Signer): Contract {
  return new Contract(notarizeContractAddress, notarizeAbi, signer);
}

function getReadonlyContract() {
  return new Contract(notarizeContractAddress, notarizeAbi, getReadonlyProvider());
}

export async function getNotarizationRecord(
  hash: string,
): Promise<NotarizationRecord | null> {
  const normalizedHash = normalizeHash(hash);

  if (normalizedHash === null) {
    return null;
  }

  const contract = getReadonlyContract();
  const [notarizer, firstBlockNumber] = await Promise.all([
    contract.notarizers(normalizedHash) as Promise<string>,
    contract.firstBlockNumbers(normalizedHash) as Promise<bigint>,
  ]);

  if (firstBlockNumber === 0n) {
    return null;
  }

  const provider = getReadonlyProvider();
  const blockNumber = Number(firstBlockNumber);
  const [block, logs] = await Promise.all([
    provider.getBlock(blockNumber),
    getBlockscoutLogs({
      fromBlock: blockNumber,
      toBlock: blockNumber,
      topic1: normalizedHash,
      topic0_1_opr: "and",
    }).catch(() => []),
  ]);

  const firstLog =
    logs.find((log) => normalizeHash(log.topics[1] ?? "") === normalizedHash) ??
    null;

  return {
    hash: normalizedHash,
    notarizer,
    blockNumber,
    timestamp: block?.timestamp ?? firstLog?.timeStamp ?? null,
    txHash: firstLog?.transactionHash ?? null,
  };
}

export async function getWalletHistory(
  walletAddress: string,
): Promise<WalletHistoryEntry[]> {
  const logs = await getBlockscoutLogs({
    fromBlock: notarizeDeploymentBlock,
    toBlock: "latest",
    topic2: encodeIndexedAddress(walletAddress),
    topic0_2_opr: "and",
  });

  return logs
    .map((log) => ({
      hash: String(log.topics[1] ?? ""),
      notarizer: decodeIndexedAddress(log.topics[2] ?? ""),
      blockNumber: log.blockNumber,
      timestamp: log.timeStamp,
      txHash: log.transactionHash,
    }))
    .sort((left, right) => right.blockNumber - left.blockNumber);
}

type BlockscoutLog = {
  blockNumber: number;
  timeStamp: number | null;
  topics: string[];
  transactionHash: string;
};

type BlockscoutLogsResponse = {
  status: string;
  message: string;
  result:
    | Array<{
        blockNumber: string;
        timeStamp?: string;
        topics: string[];
        transactionHash: string;
      }>
    | string;
};

type GetBlockscoutLogsArgs = {
  fromBlock: number | "latest";
  toBlock: number | "latest";
  topic1?: string;
  topic2?: string;
  topic0_1_opr?: "and" | "or";
  topic0_2_opr?: "and" | "or";
};

async function getBlockscoutLogs({
  fromBlock,
  toBlock,
  topic1,
  topic2,
  topic0_1_opr,
  topic0_2_opr,
}: GetBlockscoutLogsArgs): Promise<BlockscoutLog[]> {
  const searchParams = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    fromBlock: String(fromBlock),
    toBlock: String(toBlock),
    address: notarizeContractAddress,
    topic0: notarizedEventTopic,
  });

  if (topic1 !== undefined) {
    searchParams.set("topic1", topic1);
  }

  if (topic2 !== undefined) {
    searchParams.set("topic2", topic2);
  }

  if (topic0_1_opr !== undefined) {
    searchParams.set("topic0_1_opr", topic0_1_opr);
  }

  if (topic0_2_opr !== undefined) {
    searchParams.set("topic0_2_opr", topic0_2_opr);
  }

  const response = await fetch(
    `${rootstockTestnetBlockscoutApiBaseUrl}?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Blockscout request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as BlockscoutLogsResponse;

  if (!Array.isArray(payload.result)) {
    if (
      typeof payload.result === "string" &&
      payload.result.toLowerCase().includes("no records")
    ) {
      return [];
    }

    throw new Error(payload.message || "Unsupported operation");
  }

  return payload.result.map((log) => ({
    blockNumber: parseBlockscoutInteger(log.blockNumber),
    timeStamp:
      log.timeStamp === undefined ? null : parseBlockscoutInteger(log.timeStamp),
    topics: log.topics,
    transactionHash: log.transactionHash,
  }));
}

function parseBlockscoutInteger(value: string): number {
  if (value.startsWith("0x") || value.startsWith("0X")) {
    return Number.parseInt(value, 16);
  }

  return Number.parseInt(value, 10);
}

function encodeIndexedAddress(address: string): string {
  return zeroPadValue(address, 32).toLowerCase();
}

function decodeIndexedAddress(value: string): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    return value;
  }

  return `0x${value.slice(-40)}`.toLowerCase();
}

export function explorerTransactionUrl(txHash: string): string {
  return `${rootstockTestnetExplorerBaseUrl}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${rootstockTestnetExplorerBaseUrl}/address/${address}`;
}

export function formatTimestamp(timestamp: number | null): string {
  if (timestamp === null) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(timestamp * 1000));
}
