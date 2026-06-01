"use client";

import Link from "next/link";

import { DemoRoleSelector } from "@/components/security/DemoRoleSelector";
import { UsaHeader } from "@/components/uswds/UsaHeader";
import { useDemoUser } from "@/lib/demo-auth";

export function AppHeader() {
  const { hasPermission } = useDemoUser();

  return (
    <UsaHeader title="VA OIG FWA Risk Triage">
      <nav aria-label="Primary navigation" className="usa-nav">
        <ul className="usa-nav__primary usa-accordion">
          <li className="usa-nav__primary-item">
            <Link className="usa-nav-link" href="/dashboard">
              Executive dashboard
            </Link>
          </li>
          <li className="usa-nav__primary-item">
            <Link className="usa-nav-link" href="/risk-queue">
              Risk queue
            </Link>
          </li>
          <li className="usa-nav__primary-item">
            <Link className="usa-nav-link" href="/reports">
              Reports
            </Link>
          </li>
          {hasPermission("CanViewAdmin") ? (
            <li className="usa-nav__primary-item">
              <Link className="usa-nav-link" href="/admin/security">
                Security
              </Link>
            </li>
          ) : null}
        </ul>
        <DemoRoleSelector />
      </nav>
    </UsaHeader>
  );
}
