import type { Metadata } from "next";

import { ProcedureCodeAdminView } from "@/components/admin/ProcedureCodeAdminView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Procedure Code Administration"
};

export default function ProcedureCodeAdminPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reference data"
        title="Procedure Code Administration"
        description="Maintain synthetic procedure codes and human-readable meanings used by manual triage intake."
      />
      <ProcedureCodeAdminView />
    </div>
  );
}
