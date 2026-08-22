import type { Metadata } from "next";

import { CreateCaseRecordForm } from "@/components/cases/CreateCaseRecordForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { UsaBreadcrumb } from "@/components/uswds/UsaBreadcrumb";

export const metadata: Metadata = {
  title: "Create Case Record"
};

export default function NewCaseRecordPage() {
  return (
    <div className="page-stack">
      <UsaBreadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/risk-queue", label: "Risk queue" },
          { label: "Create case record" }
        ]}
      />
      <PageHeader
        eyebrow="Manual case intake"
        title="Create Case Record"
        description="Create a synthetic triage case from analyst intake. This records potential risk indicators for review and does not represent confirmed fraud, waste, or abuse."
      />
      <CreateCaseRecordForm />
    </div>
  );
}
