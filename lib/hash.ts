import { keccak256, toUtf8Bytes } from "ethers";

export function hashText(value: string): string {
  if (value.length === 0) {
    throw new Error("Enter some text before hashing.");
  }

  return keccak256(toUtf8Bytes(value));
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return keccak256(new Uint8Array(buffer));
}

export function normalizeHash(value: string): string | null {
  const trimmed = value.trim();

  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return null;
  }

  return trimmed.toLowerCase();
}
