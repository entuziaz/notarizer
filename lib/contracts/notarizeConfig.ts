export const notarizeContractAddress =
  process.env.NEXT_PUBLIC_NOTARIZE_CONTRACT_ADDRESS;

export const rootstockTestnetRpcUrl =
  process.env.NEXT_PUBLIC_ROOTSTOCK_TESTNET_RPC_URL ??
  "https://public-node.testnet.rsk.co";

export const rootstockTestnetExplorerBaseUrl =
  process.env.NEXT_PUBLIC_ROOTSTOCK_TESTNET_EXPLORER_BASE_URL ??
  "https://rootstock-testnet.blockscout.com";

export const rootstockTestnetBlockscoutApiBaseUrl =
  `${rootstockTestnetExplorerBaseUrl}/api`;

export const notarizeDeploymentBlock = Number(
  process.env.NEXT_PUBLIC_NOTARIZE_DEPLOYMENT_BLOCK ?? 7479204,
);

export const rootstockTestnetChainId = 31;
