"use client";

import { useState } from "react";

import { useWallet } from "@/components/wallet-provider";

export function WalletControl() {
  const {
    account,
    chainId,
    connectWallet,
    disconnectWallet,
    errorMessage,
    explorerUrl,
    hasWallet,
    isConnected,
    isHydrated,
    isWrongNetwork,
    status,
    switchToRootstock,
  } = useWallet();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (account === null) {
      return;
    }

    await navigator.clipboard.writeText(account);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  const buttonLabel = !isHydrated
    ? "Wallet"
    : !hasWallet
      ? "No Wallet"
      : status === "connecting"
        ? "Connecting..."
        : isWrongNetwork
          ? "Wrong Network"
          : isConnected && account !== null
            ? shortenAddress(account)
            : "Connect Wallet";

  return (
    <details className="group relative z-[70]">
      <summary className="flex list-none items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-surface-strong">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            !isHydrated
              ? "bg-muted"
              : isConnected
                ? "bg-success"
                : isWrongNetwork
                  ? "bg-danger"
                  : "bg-accent"
          }`}
        />
        <span>{buttonLabel}</span>
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] w-80 rounded-[1.5rem] border border-line bg-surface px-4 py-4 shadow-2xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Wallet
        </p>
        <p className="mt-3 text-sm text-muted">
          {!hasWallet
            ? "Install an injected wallet such as MetaMask to connect."
            : isWrongNetwork
              ? "Your wallet is not on Rootstock Testnet yet."
              : isConnected
                ? "The connected wallet can sign Rootstock notarization transactions."
                : "Connect your wallet to notarize content and load wallet history."}
        </p>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="rounded-2xl border border-line bg-surface-strong px-3 py-3">
            <dt className="text-muted">Status</dt>
            <dd className="mt-1 text-foreground">
              {statusLabel(status, isWrongNetwork, isConnected)}
            </dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface-strong px-3 py-3">
            <dt className="text-muted">Address</dt>
            <dd className="mt-1 break-all font-mono text-xs text-foreground">
              {account ?? "Not connected"}
            </dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface-strong px-3 py-3">
            <dt className="text-muted">Chain</dt>
            <dd className="mt-1 text-foreground">
              {chainId === null ? "Unavailable" : `${chainId} (${chainId === 31 ? "Rootstock Testnet" : "Unsupported"})`}
            </dd>
          </div>
        </dl>

        {errorMessage !== null ? (
          <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/8 px-3 py-3 text-sm text-danger">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {!isConnected ? (
            <button
              type="button"
              onClick={() => {
                if (isWrongNetwork) {
                  void switchToRootstock();
                } else {
                  void connectWallet();
                }
              }}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#0b1317] transition-colors hover:bg-accent-strong"
            >
              {isWrongNetwork ? "Switch Network" : "Connect Wallet"}
            </button>
          ) : null}

          {isConnected && account !== null ? (
            <>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-surface-strong"
              >
                {copied ? "Copied" : "Copy Address"}
              </button>
              {explorerUrl !== null ? (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-surface-strong"
                >
                  View Explorer
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  disconnectWallet();
                  const details = document.activeElement?.closest("details");
                  if (details instanceof HTMLDetailsElement) {
                    details.open = false;
                  }
                }}
                className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-danger/40 hover:bg-danger/8"
              >
                Disconnect
              </button>
            </>
          ) : null}
        </div>

        {isConnected ? (
          <p className="mt-4 text-xs leading-6 text-muted">
            &quot;Disconnect&quot; clears the app session locally. To revoke site
            permissions completely, use your wallet extension settings.
          </p>
        ) : null}
      </div>
    </details>
  );
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function statusLabel(
  status: string,
  isWrongNetwork: boolean,
  isConnected: boolean,
): string {
  if (isConnected) {
    return "Connected";
  }

  if (isWrongNetwork) {
    return "Wrong network";
  }

  if (status === "connecting") {
    return "Connecting";
  }

  if (status === "no-wallet") {
    return "No injected wallet found";
  }

  return "Not connected";
}
