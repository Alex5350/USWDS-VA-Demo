import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { AdminSecurityView } from "@/components/security/AdminSecurityView";

export const metadata: Metadata = {
  title: "Admin Security"
};

export default function AdminSecurityPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Mock security"
        title="Admin Security"
        description="Demonstration-only authentication and policy-based authorization details for the local interview app."
      />
      <AdminSecurityView />
    </div>
  );
}
