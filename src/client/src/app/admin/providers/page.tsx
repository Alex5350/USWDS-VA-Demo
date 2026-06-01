import type { Metadata } from "next";

import { ProviderAdminView } from "@/components/admin/ProviderAdminView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Provider Administration"
};

export default function ProviderAdminPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reference data"
        title="Provider Administration"
        description="Add, update, or disable synthetic Community Care providers used by manual triage intake."
      />
      <ProviderAdminView />
    </div>
  );
}
