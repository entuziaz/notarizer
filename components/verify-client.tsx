"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { AppShell } from "@/components/app-shell";
import { getErrorMessage } from "@/lib/errors";
import { hashFile, hashText, normalizeHash } from "@/lib/hash";
import {
  explorerAddressUrl,
  explorerTransactionUrl,
  formatTimestamp,
  getNotarizationRecord,
} from "@/lib/rootstock";

type VerifyClientProps = {
  initialHash: string;
};

export function VerifyClient({ initialHash }: VerifyClientProps) {
  const [hashInput, setHashInput] = useState(initialHash);
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comparisonHash, setComparisonHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [record, setRecord] = useState<Awaited<ReturnType<typeof getNotarizationRecord>> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasLoadedRouteHash, setHasLoadedRouteHash] = useState(false);

  const normalizedHash = useMemo(() => normalizeHash(hashInput), [hashInput]);
  const hashesMatch = normalizedHash !== null && comparisonHash !== null
    ? normalizedHash === comparisonHash
    : null;

  async function loadRecord(nextHash: string) {
    setErrorMessage(null);
    setStatusMessage(null);

    const normalized = normalizeHash(nextHash);

    if (normalized === null) {
      setRecord(null);
      setErrorMessage("Enter a valid 32-byte hash before loading the on-chain record.");
      return;
    }

    const nextRecord = await getNotarizationRecord(normalized);
    setRecord(nextRecord);

    if (nextRecord === null) {
      setStatusMessage("No on-chain anchor was found for this hash.");
    } else {
      setStatusMessage("On-chain record loaded from Rootstock Testnet.");
    }
  }

  useEffect(() => {
    if (hasLoadedRouteHash) {
      return;
    }

    startTransition(async () => {
      try {
        await loadRecord(initialHash);
        setHasLoadedRouteHash(true);
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    });
  }, [hasLoadedRouteHash, initialHash]);

  function handleLoadRecord() {
    startTransition(async () => {
      try {
        await loadRecord(hashInput);
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    });
  }

  async function handleTextComparison() {
    try {
      setComparisonHash(hashText(textInput));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleFileComparison() {
    try {
      if (selectedFile === null) {
        throw new Error("Choose a file before computing a comparison hash.");
      }

      setComparisonHash(await hashFile(selectedFile));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <AppShell
      eyebrow="Verification Route"
      title="Check whether this hash was anchored first."
      description="This page reads the stored notarizer and first block number from the contract, resolves the block timestamp over RPC, and lets you recompute a local hash for comparison."
      aside={
        <>
          <InfoCard
            title="Route contract"
            content="The shareable path is /verify/<hash>. If the hash is missing or malformed, the contract is not queried."
          />
          <InfoCard
            title="What compare means"
            content="A comparison hash only proves your local bytes match the hash in the route. It does not prove legal authorship or control of the original wallet."
          />
        </>
      }
    >
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            Hash under review
          </span>
          <input
            value={hashInput}
            onChange={(event) => setHashInput(event.target.value)}
            className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 font-mono text-xs text-foreground outline-none placeholder:text-muted/60 focus:border-accent/50"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleLoadRecord}
            disabled={isPending}
            className="rounded-full bg-surface-soft px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Loading..." : "Load record"}
          </button>
          {normalizedHash !== null ? (
            <Link
              href={`/verify/${normalizedHash}`}
              prefetch={false}
              className="rounded-full border border-accent/50 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              Open canonical route
            </Link>
          ) : null}
        </div>

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
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Verification result
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {isPending ? "Loading on-chain record..." : "Resolved from contract state and indexed event logs."}
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
              record === null
                ? "border border-danger/30 bg-danger/8 text-danger"
                : "border border-success/30 bg-success/8 text-success"
            }`}
          >
            {record === null ? "Not found" : "Anchored"}
          </span>
        </div>

        {record !== null ? (
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <ResultRow label="Hash" value={record.hash} mono />
            <ResultRow label="Notarizer" value={record.notarizer} mono />
            <ResultRow
              label="First block number"
              value={String(record.blockNumber)}
            />
            <ResultRow
              label="Resolved timestamp"
              value={formatTimestamp(record.timestamp)}
            />
            <ResultRow label="Transaction" value={record.txHash ?? "Unavailable"} mono />
            <ResultRow
              label="Explorer"
              value={record.txHash === null ? "Unavailable" : explorerTransactionUrl(record.txHash)}
              mono
            />
          </dl>
        ) : null}

        {record !== null ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {record.txHash !== null ? (
              <a
                href={explorerTransactionUrl(record.txHash)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10"
              >
                View transaction
              </a>
            ) : null}
            <a
              href={explorerAddressUrl(record.notarizer)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10"
            >
              View wallet
            </a>
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <h2 className="text-xl font-semibold text-foreground">
          Recompute locally
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Paste text or choose a file to generate a fresh local hash and compare
          it with the route hash.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Paste text
              </span>
              <textarea
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                rows={8}
                className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm leading-7 text-foreground outline-none placeholder:text-muted/60 focus:border-accent/50"
                placeholder="Paste the exact text to compare against the route hash."
              />
            </label>
            <button
              type="button"
              onClick={handleTextComparison}
              className="rounded-full bg-surface-soft px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-strong"
            >
              Hash pasted text
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-line bg-surface-strong px-6 py-8 text-center">
              <span className="text-base font-medium text-foreground">
                {selectedFile === null ? "Choose a file" : selectedFile.name}
              </span>
              <span className="mt-2 text-sm text-muted">
                The file bytes stay local and are hashed in the browser.
              </span>
              <input
                type="file"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
            </label>
            <button
              type="button"
              onClick={handleFileComparison}
              className="rounded-full bg-surface-soft px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-strong"
            >
              Hash selected file
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-line bg-surface-strong px-4 py-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            Comparison hash
          </p>
          <p className="mt-3 break-all font-mono text-xs leading-6 text-foreground">
            {comparisonHash ?? "No comparison hash generated yet."}
          </p>
          {hashesMatch !== null ? (
            <p
              className={`mt-4 text-sm ${
                hashesMatch ? "text-success" : "text-danger"
              }`}
            >
              {hashesMatch
                ? "The local content hash matches the route hash."
                : "The local content hash does not match the route hash."}
            </p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function ResultRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
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
