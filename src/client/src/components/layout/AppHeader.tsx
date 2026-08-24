"use client";

import Image from "next/image";
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
          <Image
            className="oig-brand__logo"
            src="/brand/va-header-logo.png"
            alt="VA logo and seal"
            width={135}
            height={57}
          />
          <span className="oig-brand__text">
            <span className="oig-brand__department">U.S. Department of Veterans Affairs</span>
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
