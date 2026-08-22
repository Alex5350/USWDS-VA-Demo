import { redirect } from "next/navigation";

export default function LegacyRiskQueueNewPage() {
  redirect("/cases/new");
}
