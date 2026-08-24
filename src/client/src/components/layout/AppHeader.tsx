"use client";

import Link from "next/link";

import { DemoRoleSelector } from "@/components/security/DemoRoleSelector";
import { useDemoUser } from "@/lib/demo-auth";

export function AppHeader() {
  const { hasPermission } = useDemoUser();

  return (
    <header className="oig-header" role="banner">
      <div className="oig-header__rule" aria-hidden="true" />
      <div className="oig-header__inner">
        <Link className="oig-brand" href="/" aria-label="VA OIG FWA Risk Triage home">
          <span className="oig-brand__seal" aria-hidden="true">
            <span className="oig-brand__seal-ring">
              <span className="oig-brand__seal-va">VA</span>
              <span className="oig-brand__seal-oig">OIG</span>
            </span>
          </span>
          <span className="oig-brand__text">
            <span className="oig-brand__agency">Department of Veterans Affairs</span>
            <span className="oig-brand__office">Office of Inspector General</span>
            <span className="oig-brand__product">FWA Risk Triage & Reporting Portal</span>
          </span>
        </Link>

        <div className="oig-header__operations">
          <nav aria-label="Primary navigation" className="oig-nav">
            <ul className="oig-nav__list">
              <li>
                <Link className="oig-nav__link" href="/dashboard">
                  Executive dashboard
                </Link>
              </li>
              <li>
                <Link className="oig-nav__link" href="/risk-queue">
                  Risk queue
                </Link>
              </li>
              <li>
                <Link className="oig-nav__link" href="/reports">
                  Reports
                </Link>
              </li>
              {hasPermission("CanViewAdmin") ? (
                <li>
                  <Link className="oig-nav__link" href="/admin/security">
                    Security
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>

          <div className="oig-header__role-panel">
            <DemoRoleSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
