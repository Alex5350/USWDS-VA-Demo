export type NavItem = {
  href: string;
  label: string;
  permission: string | null;
  children?: NavItem[];
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", permission: null },
  { href: "/dashboard", label: "Executive dashboard", permission: "CanViewDashboard" },
  {
    href: "/risk-queue",
    label: "Risk queue",
    permission: "CanViewRiskQueue",
    children: [
      { href: "/cases/new", label: "Create case record", permission: "CanCreateCaseRecord" },
      { href: "/cases/recycle-bin", label: "Recycle bin", permission: "CanDeleteCase" }
    ]
  },
  {
    href: "/chat/new",
    label: "Case assistant",
    permission: "CanViewRiskQueue",
    children: [
      { href: "/chat/new", label: "New chat", permission: "CanViewRiskQueue" },
      { href: "/chat/history", label: "Chat history", permission: "CanViewRiskQueue" }
    ]
  },
  { href: "/rules", label: "Rules", permission: "CanViewRiskQueue" },
  {
    href: "/reports",
    label: "Reports",
    permission: "CanViewDashboard",
    children: [
      { href: "/reports/provider-risk", label: "Provider risk", permission: "CanViewDashboard" },
      { href: "/reports/questioned-cost", label: "Questioned cost", permission: "CanViewDashboard" },
      { href: "/reports/case-aging", label: "Case aging", permission: "CanViewDashboard" }
    ]
  },
  { href: "/admin/providers", label: "Provider admin", permission: "CanManageProviders" },
  { href: "/admin/procedure-codes", label: "Procedure code admin", permission: "CanManageProcedureCodes" },
  { href: "/admin/security", label: "Admin security", permission: "CanViewAdmin" }
];
