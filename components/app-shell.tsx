"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { WalletControl } from "@/components/wallet-control";

const navItems = [
  { href: "/notarize", label: "Notarize" },
  { href: "/history", label: "History" },
];

type AppShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
};

export function AppShell({
  title,
  eyebrow,
  description,
  children,
  aside,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
      <div className="relative z-50 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-line bg-surface/75 px-5 py-4 backdrop-blur">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">
          Rootstock Notarizer
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex flex-wrap gap-2 text-sm">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === "/notarize" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`rounded-full border px-4 py-2 transition-colors ${
                    active
                      ? "border-accent/70 bg-accent/10 text-foreground"
                      : "border-line text-muted hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <WalletControl />
        </div>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <header className="rounded-[2rem] border border-line bg-surface px-6 py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-strong">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              {description}
            </p>
          </header>
          {children}
        </div>
        <aside className="space-y-4">{aside}</aside>
      </section>
    </main>
  );
}
