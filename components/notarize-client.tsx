"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { AppShell } from "@/components/app-shell";
import { useWallet } from "@/components/wallet-provider";
import { getErrorMessage } from "@/lib/errors";
import { hashFile, hashText } from "@/lib/hash";
import {
  explorerAddressUrl,
  explorerTransactionUrl,
  formatTimestamp,
  getReadonlyProvider,
  getWritableContract,
  rootstockTestnetChainId,
} from "@/lib/rootstock";

type Mode = "text" | "file";

type ProofResult = {
  hash: string;
  txHash: string;
  blockNumber: number;
  timestamp: number | null;
  notarizer: string;
};

export function NotarizeClient() {
  const [mode, setMode] = useState<Mode>("text");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { account, connectWallet, isConnected, isWrongNetwork, switchToRootstock } =
    useWallet();

  const verifyLink = useMemo(() => {
    if (proofResult === null) {
      return null;
    }

    return `/verify/${proofResult.hash}`;
  }, [proofResult]);

  async function handleHashGeneration() {
    try {
      setErrorMessage(null);
      setStatusMessage(null);
      setProofResult(null);

      const nextHash =
        mode === "text"
          ? hashText(textInput)
          : selectedFile === null
            ? null
            : await hashFile(selectedFile);

      if (nextHash === null) {
        throw new Error(
          mode === "text"
            ? "Enter some text before hashing."
            : "Select a file before hashing.",
        );
      }

      setComputedHash(nextHash);
      setStatusMessage("Hash generated locally in the browser. No content was uploaded.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleNotarize() {
    startTransition(async () => {
      try {
        setErrorMessage(null);
        setStatusMessage(null);
        setProofResult(null);

        if (computedHash === null) {
          throw new Error("Generate a hash before submitting the transaction.");
        }

        if (!isConnected || account === null) {
          throw new Error("Connect a Rootstock Testnet wallet before notarizing.");
        }

        const provider = window.ethereum;
        if (provider === undefined) {
          throw new Error("No injected wallet was found. Install MetaMask or another EIP-1193 wallet.");
        }

        const browserProvider = new (await import("ethers")).BrowserProvider(provider);
        const signer = await browserProvider.getSigner();
        const contract = getWritableContract(signer);

        setStatusMessage("Waiting for wallet confirmation.");

        const transaction = await contract.notarize(computedHash);
        setStatusMessage("Transaction submitted. Waiting for confirmation on Rootstock Testnet.");

        const receipt = await transaction.wait();

        if (receipt === null) {
          throw new Error("The transaction did not return a receipt.");
        }

        const readonlyProvider = getReadonlyProvider();
        const block = await readonlyProvider.getBlock(receipt.blockNumber);

        setProofResult({
          hash: computedHash,
          txHash: transaction.hash,
          blockNumber: receipt.blockNumber,
          timestamp: block?.timestamp ?? null,
          notarizer: account,
        });
        setStatusMessage("Hash anchored successfully.");
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <AppShell
      eyebrow="Client-Side Hashing"
      title="Create a shareable Rootstock proof."
      description="Hash text or file bytes in the browser, connect an injected wallet, and send exactly one Rootstock transaction to anchor the fingerprint."
      aside={
        <>
          <InfoCard
            title="Hashing policy"
            content="Text is hashed as exact UTF-8 bytes. Files are hashed as raw bytes. The app does not trim, normalize, or upload your content."
          />
          <InfoCard
            title="Front-running caveat"
            content="The current contract stores the first visible hash on-chain. Unsalted hashes can be copied from the mempool before confirmation."
          />
          <InfoCard
            title="Active network"
            content={`Wallet actions require Rootstock Testnet (chain ID ${rootstockTestnetChainId}). Use the wallet control in the top-right corner to connect or switch networks.`}
          />
        </>
      }
    >
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <div className="flex flex-wrap gap-3">
          <ModeButton
            active={mode === "text"}
            onClick={() => {
              setMode("text");
              setSelectedFile(null);
            }}
          >
            Paste text
          </ModeButton>
          <ModeButton
            active={mode === "file"}
            onClick={() => {
              setMode("file");
              setTextInput("");
            }}
          >
            Upload file
          </ModeButton>
        </div>

        <div className="mt-5">
          {mode === "text" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Text payload
              </span>
              <textarea
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                rows={10}
                placeholder="Paste the exact text you want to notarize."
                className="min-h-52 w-full rounded-[1.5rem] border border-line bg-surface-strong px-4 py-4 text-sm leading-7 text-foreground outline-none placeholder:text-muted/60 focus:border-accent/60"
              />
            </label>
          ) : (
            <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-line bg-surface-strong px-6 py-8 text-center">
              <span className="text-base font-medium text-foreground">
                {selectedFile === null ? "Choose a file" : selectedFile.name}
              </span>
              <span className="mt-2 text-sm text-muted">
                The raw bytes are hashed locally. No upload request is made.
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
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <ActionButton onClick={handleHashGeneration}>
            Generate hash
          </ActionButton>
          <ActionButton
            secondary
            onClick={() => {
              void (isWrongNetwork ? switchToRootstock() : connectWallet());
            }}
          >
            {isConnected ? "Wallet connected" : isWrongNetwork ? "Switch network" : "Connect wallet"}
          </ActionButton>
          <ActionButton
            accent
            onClick={handleNotarize}
            disabled={isPending || computedHash === null}
          >
            {isPending ? "Submitting..." : "Anchor on Rootstock"}
          </ActionButton>
        </div>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <h2 className="text-xl font-semibold text-foreground">Current hash</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Generate the hash before sending the transaction so you can inspect the
          exact fingerprint first.
        </p>
        <div className="mt-4 rounded-[1.5rem] border border-line bg-surface-strong px-4 py-4 font-mono text-xs leading-6 break-all text-foreground">
          {computedHash ?? "No hash generated yet."}
        </div>
        {account !== null ? (
          <p className="mt-3 text-xs text-muted">
            Connected wallet: <span className="font-mono text-foreground">{account}</span>
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

      {proofResult !== null ? (
        <section className="rounded-[2rem] border border-accent/40 bg-surface px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Proof created
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                On-chain anchor confirmed
              </h2>
            </div>
            {verifyLink !== null ? (
              <Link
                href={verifyLink}
                className="rounded-full border border-accent/50 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
              >
                Open verify link
              </Link>
            ) : null}
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <ProofRow label="Hash" value={proofResult.hash} mono />
            <ProofRow label="Transaction" value={proofResult.txHash} mono />
            <ProofRow label="Block number" value={String(proofResult.blockNumber)} />
            <ProofRow
              label="Block timestamp"
              value={formatTimestamp(proofResult.timestamp)}
            />
            <ProofRow label="Notarizer" value={proofResult.notarizer} mono />
            <ProofRow
              label="Shareable verify path"
              value={verifyLink ?? ""}
              mono
            />
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={explorerTransactionUrl(proofResult.txHash)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10"
            >
              View transaction
            </a>
            <a
              href={explorerAddressUrl(proofResult.notarizer)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10"
            >
              View wallet
            </a>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  secondary,
  accent,
}: {
  children: string;
  onClick: () => void;
  disabled?: boolean;
  secondary?: boolean;
  accent?: boolean;
}) {
  let className =
    "rounded-full px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  if (accent) {
    className +=
      " bg-accent text-[#0b1317] hover:bg-accent-strong";
  } else if (secondary) {
    className +=
      " border border-line text-foreground hover:border-accent/50 hover:bg-surface-strong";
  } else {
    className +=
      " bg-surface-soft text-foreground hover:bg-surface-strong";
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? "border-accent/60 bg-accent/12 text-foreground"
          : "border-line text-muted hover:border-accent/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ProofRow({
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
