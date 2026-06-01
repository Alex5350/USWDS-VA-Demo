import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { SyntheticDataNotice } from "@/components/layout/SyntheticDataNotice";
import { UsaButton } from "@/components/uswds/UsaButton";

export const metadata: Metadata = {
  title: "Home"
};

const primaryWorkflows = [
  {
    href: "/dashboard",
    label: "Executive dashboard",
    description: "Review claim volume, estimated questioned cost, provider patterns, and open case workload.",
    action: "Open executive dashboard"
  },
  {
    href: "/risk-queue",
    label: "Risk queue",
    description: "Filter and sort review candidates by risk level, status, provider type, and service date.",
    action: "Review risk queue"
  },
  {
    href: "/risk-queue/new",
    label: "Add review candidate",
    description: "Create a manual triage record from analyst intake using explainable risk indicators.",
    action: "Start intake"
  },
  {
    href: "/reports",
    label: "Reporting",
    description: "Use SQL-backed report tables, export actions, and Power BI-ready reporting placeholders.",
    action: "View reports"
  }
];

export default function HomePage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Community Care oversight demo"
        title="VA OIG FWA Risk Triage & Reporting Portal"
        description="A synthetic-data operations portal for prioritizing potential fraud, waste, abuse, and improper-payment review candidates using transparent rules and SQL-ready reporting patterns."
      />
      <SyntheticDataNotice />

      <section className="home-workflow-grid" aria-label="Primary demo workflows">
        {primaryWorkflows.map((workflow) => (
          <Link className="workflow-card" href={workflow.href} key={workflow.href}>
            <span className="workflow-card__heading">{workflow.label}</span>
            <span className="workflow-card__description">{workflow.description}</span>
            <span className="workflow-card__action">{workflow.action}</span>
          </Link>
        ))}
      </section>

      <section className="panel" aria-labelledby="mission-fit-heading">
        <h2 id="mission-fit-heading">Mission Fit</h2>
        <p>
          The application treats risk scoring as triage. It does not determine fraud or automate enforcement. It helps
          analysts decide which synthetic claims, providers, and complaints may deserve review first.
        </p>
        <div className="action-row">
          <UsaButton href="/dashboard">Open executive dashboard</UsaButton>
          <UsaButton href="/risk-queue" variant="outline">
            Review risk queue
          </UsaButton>
          <UsaButton href="/reports" variant="outline">
            View reports
          </UsaButton>
        </div>
      </section>
    </div>
  );
}
