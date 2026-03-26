export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const nested = getNestedMessage(error);

    if (nested !== null) {
      return nested;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while talking to Rootstock Testnet.";
}

function getNestedMessage(value: object): string | null {
  const candidates = [
    "shortMessage",
    "reason",
    "message",
  ] as const;

  for (const key of candidates) {
    const candidate = Reflect.get(value, key);

    if (typeof candidate === "string") {
      if (candidate.includes("HashAlreadyNotarized")) {
        return "This hash has already been notarized. The contract only records the first anchor.";
      }

      if (candidate.includes("ZeroHashNotAllowed")) {
        return "The zero hash is not allowed.";
      }

      if (candidate.includes("user rejected") || candidate.includes("ACTION_REJECTED")) {
        return "The wallet request was rejected.";
      }

      return candidate;
    }
  }

  const nestedError = Reflect.get(value, "error");
  if (typeof nestedError === "object" && nestedError !== null) {
    return getNestedMessage(nestedError);
  }

  const info = Reflect.get(value, "info");
  if (typeof info === "object" && info !== null) {
    return getNestedMessage(info);
  }

  return null;
}
