export const notarizeAbi = [
  "function notarizers(bytes32 hash) view returns (address)",
  "function firstBlockNumbers(bytes32 hash) view returns (uint256)",
  "function notarize(bytes32 hash)",
  "event Notarized(bytes32 indexed hash, address indexed notarizer, uint256 blockNumber)",
] as const;
