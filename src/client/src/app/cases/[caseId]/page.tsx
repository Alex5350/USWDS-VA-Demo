import type { Metadata } from "next";

import { CaseDetailView } from "@/components/cases/CaseDetailView";
import { PageHeader } from "@/components/layout/PageHeader";

type CasePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const { caseId } = await params;
  return {
    title: `Case ${caseId}`
  };
}

export default async function CasePage({ params }: CasePageProps) {
  const { caseId } = await params;
  const numericCaseId = Number(caseId);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Analyst review"
        title={`Case ${Number.isFinite(numericCaseId) ? numericCaseId : caseId}`}
        description="Detailed synthetic case view showing claim context, provider context, authorization status, risk findings, complaints, notes, and workflow controls."
      />
      <CaseDetailView caseId={Number.isFinite(numericCaseId) ? numericCaseId : 1001} />
    </div>
  );
}
