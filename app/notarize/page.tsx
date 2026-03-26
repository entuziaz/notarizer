import type { Metadata } from "next";

import { NotarizeClient } from "@/components/notarize-client";

export const metadata: Metadata = {
  title: "Notarize | Rootstock Content Notarization Tool",
};

export default function NotarizePage() {
  return <NotarizeClient />;
}
