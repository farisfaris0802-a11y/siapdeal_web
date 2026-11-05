import { redirect } from "next/navigation";

export default function SimulatorEntryPage() {
  redirect("/simulasi/baru?demo=1");
}
