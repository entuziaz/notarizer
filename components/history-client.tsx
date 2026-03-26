"use client";

import { useState, useTransition } from "react";

import { AppShell } from "@/components/app-shell";
import { useWallet } from "@/components/wallet-provider";
import { getErrorMessage } from "@/lib/errors";
import {
  explorerTransactionUrl,
  formatTimestamp,
  getWalletHistory,
  rootstockTestnetChainId,
} from "@/lib/rootstock";

export function HistoryClient() {
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getWalletHistory>>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { account, connectWallet, isConnected, isWrongNetwork, switchToRootstock } =
    useWallet();

  async function loadHistory() {
    startTransition(async () => {
      try {
        setErrorMessage(null);
        setStatusMessage(null);

        if (!isConnected || account === null) {
          throw new Error("Connect a Rootstock Testnet wallet before loading wallet history.");
        }

        setStatusMessage("Loading wallet history from Rootstock Testnet event logs.");

        const nextHistory = await getWalletHistory(account);
        setHistory(nextHistory);
        setStatusMessage(
          nextHistory.length === 0
            ? "No notarization events were found for this wallet yet."
            : `Loaded ${nextHistory.length} notarization event${nextHistory.length === 1 ? "" : "s"}.`,
        );
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <AppShell
      eyebrow="Event Timeline"
      title="Read every anchor tied to the connected wallet."
      description="This view filters the Notarized event by wallet address, starts from the deployment block, and resolves block timestamps so the full timeline is human-readable."
      aside={
        <>
          <InfoCard
            title="History primitive"
            content="Wallet history is derived from emitted Notarized events, not a second on-chain index. That keeps storage small and makes the event log the canonical feed."
          />
          <InfoCard
            title="Network requirement"
            content={`Use the shared wallet control to connect the wallet and switch to Rootstock Testnet (chain ID ${rootstockTestnetChainId}) before querying history.`}
          />
        </>
      }
    >
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Wallet history
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Connect an injected wallet and load every notarization event
              emitted by the deployed contract for that address.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isWrongNetwork) {
                void switchToRootstock();
                return;
              }

              if (!isConnected) {
                void connectWallet();
                return;
              }

              void loadHistory();
            }}
            disabled={isPending}
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-[#0b1317] transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Loading..." : isWrongNetwork ? "Switch network" : !isConnected ? "Connect wallet" : "Load history"}
          </button>
        </div>

        {account !== null ? (
          <p className="mt-4 rounded-2xl border border-line bg-surface-strong px-4 py-3 text-sm text-muted">
            Active wallet: <span className="font-mono text-xs text-foreground">{account}</span>
          </p>
        ) : null}
        {statusMessage !== null ? (
          <p className="mt-4 rounded-2xl border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
            {statusMessage}
          </p>
        ) : null}
        {errorMessage !== null ? (
          <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Loaded events
          </h2>
          <span className="rounded-full border border-line px-4 py-2 text-xs uppercase tracking-[0.22em] text-muted">
            {history.length} item{history.length === 1 ? "" : "s"}
          </span>
        </div>

        {history.length === 0 ? (
          <p className="mt-5 text-sm leading-7 text-muted">
            No history loaded yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {history.map((entry) => (
              <article
                key={`${entry.txHash}-${entry.hash}`}
                className="rounded-[1.5rem] border border-line bg-surface-strong px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Block {entry.blockNumber}
                  </p>
                  <a
                    href={explorerTransactionUrl(entry.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-line px-3 py-2 text-xs text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10"
                  >
                    View tx
                  </a>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <HistoryRow label="Hash" value={entry.hash} mono />
                  <HistoryRow
                    label="Timestamp"
                    value={formatTimestamp(entry.timestamp)}
                  />
                  <HistoryRow label="Transaction" value={entry.txHash} mono />
                  <HistoryRow label="Notarizer" value={entry.notarizer} mono />
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function HistoryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`mt-2 break-all text-foreground ${mono ? "font-mono text-xs leading-6" : "text-sm"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function InfoCard({ title, content }: { title: string; content: string }) {
  return (
    <section className="rounded-[1.75rem] border border-line bg-surface px-5 py-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{content}</p>
    </section>
  );
}
