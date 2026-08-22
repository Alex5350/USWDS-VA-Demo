import type { Metadata } from "next";

import { CaseRecycleBinView } from "@/components/cases/CaseRecycleBinView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Case Recycle Bin"
};

export default function CaseRecycleBinPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Case recovery"
        title="Case Recycle Bin"
        description="Review soft-deleted synthetic case records and restore records back to the active risk queue when appropriate."
      />
      <CaseRecycleBinView />
    </div>
  );
}
