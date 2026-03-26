import type { Metadata } from "next";

import { HistoryClient } from "@/components/history-client";

export const metadata: Metadata = {
  title: "History | Rootstock Content Notarization Tool",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
