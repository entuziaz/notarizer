import Link from "next/link";

import { WalletControl } from "@/components/wallet-control";

const cards = [
  {
    href: "/notarize",
    label: "Notarize",
    eyebrow: "Write Once",
    description:
      "Hash a file or text locally, submit one Rootstock transaction, and keep a shareable proof link.",
  },
  {
    href: "/verify/0x0000000000000000000000000000000000000000000000000000000000000000",
    label: "Verify",
    eyebrow: "Check Any Hash",
    description:
      "Open a proof route, read the first on-chain anchor, and compare against freshly computed content hashes.",
  },
  {
    href: "/history",
    label: "History",
    eyebrow: "Wallet Timeline",
    description:
      "Load all notarization events for the connected wallet with block times and explorer links.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
      <div className="relative z-50 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-line bg-surface/75 px-5 py-4 backdrop-blur">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">
          Rootstock Notarizer
        </Link>
        <WalletControl />
      </div>

      <header className="mt-6 flex flex-col gap-6 rounded-[2rem] border border-line bg-surface/80 px-6 py-8 backdrop-blur sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent">
            Rootstock Testnet
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Anchor proof-of-existence records without sending content anywhere.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
            This dApp hashes text and files in the browser, stores only the
            first anchor on-chain, and lets anyone verify that a specific hash
            existed by a specific Rootstock block.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-muted sm:grid-cols-3 lg:max-w-md">
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <p className="font-medium text-foreground">Ownerless Contract</p>
            <p>No admin, no upgrade path, no mutable policy surface.</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <p className="font-medium text-foreground">Client-Side Hashing</p>
            <p>Raw content stays local. Only the fingerprint is transmitted.</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <p className="font-medium text-foreground">First Anchor Wins</p>
            <p>Duplicate hashes are rejected to preserve the first timestamp.</p>
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            prefetch={false}
            className="group rounded-[1.75rem] border border-line bg-surface px-6 py-6 transition-transform duration-200 hover:-translate-y-1 hover:border-accent/55 hover:bg-surface-strong"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
              {card.eyebrow}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                {card.label}
              </h2>
              <span className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors group-hover:border-accent/55 group-hover:text-foreground">
                Open
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">
              {card.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-4 rounded-[2rem] border border-line bg-surface/70 px-6 py-6 backdrop-blur sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Current chain state
          </h2>
          <p className="text-sm leading-7 text-muted">
            The deployed contract is live on Rootstock Testnet and verified on
            Blockscout. The frontend uses that contract address directly, reads
            events from chain history, and resolves timestamps from the block
            number instead of storing mutable time data on-chain.
          </p>
        </div>
        <dl className="grid gap-3 text-sm">
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <dt className="text-muted">Contract</dt>
            <dd className="mt-1 break-all font-mono text-xs text-foreground">
              0xc2d018fAe55e8A4524cBD93fc8B3A9a25AbBD885
            </dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <dt className="text-muted">Deployment Block</dt>
            <dd className="mt-1 font-mono text-xs text-foreground">7479204</dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <dt className="text-muted">Explorer</dt>
            <dd className="mt-1 text-foreground">
              rootstock-testnet.blockscout.com
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
