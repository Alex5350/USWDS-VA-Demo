import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { OfficialGovBanner } from "@/components/layout/OfficialGovBanner";
import { DemoSecurityBanner } from "@/components/security/DemoSecurityBanner";
import { UsaSidenav } from "@/components/uswds/UsaSidenav";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: {
    default: "VA OIG FWA Risk Triage Demo",
    template: "%s | VA OIG FWA Risk Triage Demo"
  },
  icons: {
    icon: "/favicon.svg"
  },
  description:
    "Synthetic-data Community Care fraud, waste, abuse, and improper-payment risk triage and reporting demo."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <OfficialGovBanner />
        <AppHeader />
        <DemoSecurityBanner />
        <div className="app-shell">
          <aside className="app-sidebar">
            <UsaSidenav />
          </aside>
          <main className="app-main" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
        <footer className="app-footer">
          <div className="app-footer__inner">
            <p>VA OIG FWA Risk Triage & Reporting Portal demo.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
