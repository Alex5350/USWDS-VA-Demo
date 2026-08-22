import type { Metadata } from "next";

import { CaseEditView } from "@/components/cases/CaseEditView";
import { PageHeader } from "@/components/layout/PageHeader";

type EditCasePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function generateMetadata({ params }: EditCasePageProps): Promise<Metadata> {
  const { caseId } = await params;
  return {
    title: `Edit Case ${caseId}`
  };
}

export default async function EditCasePage({ params }: EditCasePageProps) {
  const { caseId } = await params;
  const numericCaseId = Number(caseId);
  const resolvedCaseId = Number.isFinite(numericCaseId) ? numericCaseId : 1001;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Case management"
        title={`Edit Case ${Number.isFinite(numericCaseId) ? numericCaseId : caseId}`}
        description="Update editable synthetic case and claim fields while preserving explainable risk findings and audit history."
      />
      <CaseEditView caseId={resolvedCaseId} />
    </div>
  );
}
