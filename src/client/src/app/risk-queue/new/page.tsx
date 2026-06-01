import type { Metadata } from "next";

import { CreateRiskRecordForm } from "@/components/dashboard/CreateRiskRecordForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { UsaBreadcrumb } from "@/components/uswds/UsaBreadcrumb";

export const metadata: Metadata = {
  title: "Add Review Candidate"
};

export default function NewRiskRecordPage() {
  return (
    <div className="page-stack">
      <UsaBreadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/risk-queue", label: "Risk queue" },
          { label: "Add review candidate" }
        ]}
      />
      <PageHeader
        eyebrow="Manual triage intake"
        title="Add Review Candidate"
        description="Create a synthetic manual triage candidate from analyst intake. This records potential risk indicators for review and does not represent confirmed fraud, waste, or abuse."
      />
      <CreateRiskRecordForm />
    </div>
  );
}
