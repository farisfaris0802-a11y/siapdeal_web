import type { Metadata } from "next";

import { LocalDashboard } from "@/components/local/local-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <LocalDashboard />;
}
