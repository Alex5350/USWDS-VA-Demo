"use client";

import { useDemoUser } from "@/lib/demo-auth";

export function DemoSecurityBanner() {
  const { user } = useDemoUser();

  return (
    <aside className="demo-security-banner" aria-label="Demo authentication notice">
      <div className="demo-security-banner__inner">
        <strong>Demo authentication enabled.</strong> This is not production identity management. API requests use{" "}
        <code>X-Demo-User</code> for <span>{user.email}</span>.
      </div>
    </aside>
  );
}
