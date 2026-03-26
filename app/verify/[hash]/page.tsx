import type { Metadata } from "next";

import { VerifyClient } from "@/components/verify-client";

type VerifyPageProps = {
  params: Promise<{ hash: string }>;
};

export async function generateMetadata({
  params,
}: VerifyPageProps): Promise<Metadata> {
  const { hash } = await params;

  return {
    title: `Verify ${hash.slice(0, 10)}... | Rootstock Content Notarization Tool`,
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { hash } = await params;

  return <VerifyClient initialHash={hash} />;
}
