"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useDemoUser } from "@/lib/demo-auth";

type NavItem = {
  href: string;
  label: string;
  permission: string | null;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  { href: "/", label: "Home", permission: null },
  { href: "/dashboard", label: "Executive dashboard", permission: "CanViewDashboard" },
  {
    href: "/risk-queue",
    label: "Risk queue",
    permission: "CanViewRiskQueue",
    children: [{ href: "/risk-queue/new", label: "Add review candidate", permission: "CanCreateRiskRecord" }]
  },
  { href: "/rules", label: "Rules", permission: "CanViewRiskQueue" },
  { href: "/reports", label: "Reports", permission: "CanViewDashboard" },
  { href: "/admin/providers", label: "Provider admin", permission: "CanManageProviders" },
  { href: "/admin/procedure-codes", label: "Procedure code admin", permission: "CanManageProcedureCodes" },
  { href: "/admin/security", label: "Admin security", permission: "CanViewAdmin" }
];

export function UsaSidenav() {
  const pathname = usePathname();
  const { hasPermission } = useDemoUser();
  const hasAccess = (item: NavItem) => !item.permission || hasPermission(item.permission);
  const visibleItems = navItems.filter(hasAccess);

  return (
    <nav aria-label="Primary section navigation">
      <ul className="usa-sidenav">
        {visibleItems.map((item) => {
          const visibleChildren = item.children?.filter(hasAccess) ?? [];
          const isCurrent = pathname === item.href;

          return (
            <li className="usa-sidenav__item" key={item.href}>
              <Link aria-current={isCurrent ? "page" : undefined} className={isCurrent ? "usa-current" : undefined} href={item.href}>
                {item.label}
              </Link>
              {visibleChildren.length > 0 ? (
                <ul className="usa-sidenav__sublist">
                  {visibleChildren.map((child) => {
                    const isChildCurrent = pathname === child.href;

                    return (
                      <li className="usa-sidenav__item" key={child.href}>
                        <Link
                          aria-current={isChildCurrent ? "page" : undefined}
                          className={isChildCurrent ? "usa-current" : undefined}
                          href={child.href}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
