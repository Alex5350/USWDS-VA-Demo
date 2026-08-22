"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

export type DemoRole = "ReadOnly" | "Analyst" | "Investigator" | "Supervisor" | "Administrator";

export type Permission =
  | "CanViewDashboard"
  | "CanViewRiskQueue"
  | "CanViewCaseDetail"
  | "CanEditCase"
  | "CanDeleteCase"
  | "CanAddCaseNote"
  | "CanChangeCaseStatus"
  | "CanReferCase"
  | "CanCreateCaseRecord"
  | "CanEscalateCase"
  | "CanEditRiskRules"
  | "CanExportReports"
  | "CanViewAdmin"
  | "CanManageDemoPermissions"
  | "CanViewAudit"
  | "CanManageProviders"
  | "CanManageProcedureCodes";

export type DemoUser = {
  email: string;
  displayName: string;
  role: DemoRole;
  permissions: Permission[];
};

const storageKey = "vaoig-fwa-demo-user";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const allPermissions: Permission[] = [
  "CanViewDashboard",
  "CanViewRiskQueue",
  "CanViewCaseDetail",
  "CanEditCase",
  "CanDeleteCase",
  "CanAddCaseNote",
  "CanChangeCaseStatus",
  "CanReferCase",
  "CanCreateCaseRecord",
  "CanEscalateCase",
  "CanEditRiskRules",
  "CanExportReports",
  "CanViewAdmin",
  "CanManageDemoPermissions",
  "CanViewAudit",
  "CanManageProviders",
  "CanManageProcedureCodes"
];

export const demoUsers: DemoUser[] = [
  {
    email: "demo.readonly@local",
    displayName: "Demo Read-Only User",
    role: "ReadOnly",
    permissions: ["CanViewDashboard", "CanViewRiskQueue", "CanViewCaseDetail"]
  },
  {
    email: "demo.analyst@local",
    displayName: "Demo Analyst",
    role: "Analyst",
    permissions: [
      "CanViewDashboard",
      "CanViewRiskQueue",
      "CanViewCaseDetail",
      "CanEditCase",
      "CanDeleteCase",
      "CanAddCaseNote",
      "CanChangeCaseStatus",
      "CanCreateCaseRecord",
      "CanEscalateCase",
      "CanExportReports"
    ]
  },
  {
    email: "demo.investigator@local",
    displayName: "Demo Investigator",
    role: "Investigator",
    permissions: [
      "CanViewDashboard",
      "CanViewRiskQueue",
      "CanViewCaseDetail",
      "CanEditCase",
      "CanDeleteCase",
      "CanAddCaseNote",
      "CanChangeCaseStatus",
      "CanReferCase",
      "CanCreateCaseRecord",
      "CanEscalateCase",
      "CanManageProviders",
      "CanExportReports"
    ]
  },
  {
    email: "demo.supervisor@local",
    displayName: "Demo Supervisor",
    role: "Supervisor",
    permissions: [
      "CanViewDashboard",
      "CanViewRiskQueue",
      "CanViewCaseDetail",
      "CanEditCase",
      "CanDeleteCase",
      "CanAddCaseNote",
      "CanChangeCaseStatus",
      "CanReferCase",
      "CanCreateCaseRecord",
      "CanEscalateCase",
      "CanManageProviders",
      "CanManageProcedureCodes",
      "CanExportReports"
    ]
  },
  {
    email: "demo.admin@local",
    displayName: "Demo Administrator",
    role: "Administrator",
    permissions: [
      "CanViewDashboard",
      "CanViewRiskQueue",
      "CanViewCaseDetail",
      "CanEditCase",
      "CanDeleteCase",
      "CanAddCaseNote",
      "CanChangeCaseStatus",
      "CanReferCase",
      "CanCreateCaseRecord",
      "CanEscalateCase",
      "CanEditRiskRules",
      "CanExportReports",
      "CanViewAdmin",
      "CanManageDemoPermissions",
      "CanViewAudit",
      "CanManageProviders",
      "CanManageProcedureCodes"
    ]
  }
];

export const defaultDemoUser = demoUsers[0];
let resolvedDemoUsers = demoUsers;
let demoUserVersion = 0;

export function findDemoUser(email: string | null | undefined) {
  return resolvedDemoUsers.find((user) => user.email === email) ?? defaultDemoUser;
}

export function getSelectedDemoUser() {
  if (typeof window === "undefined") {
    return defaultDemoUser;
  }

  try {
    return findDemoUser(window.sessionStorage.getItem(storageKey));
  } catch {
    return defaultDemoUser;
  }
}

export function setSelectedDemoUser(email: string) {
  const nextUser = findDemoUser(email);

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(storageKey, nextUser.email);
      window.dispatchEvent(new CustomEvent<DemoUser>("demo-user-changed", { detail: nextUser }));
    } catch {
      // The UI still updates through React state when sessionStorage is not available.
    }
  }

  return nextUser;
}

export function applyDemoUserPermissions(email: string, permissions: string[]) {
  const normalizedPermissions = permissions.filter((permission): permission is Permission =>
    allPermissions.includes(permission as Permission)
  );

  resolvedDemoUsers = resolvedDemoUsers.map((user) =>
    user.email === email ? { ...user, permissions: normalizedPermissions } : user
  );
  demoUserVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("demo-user-changed"));
  }
}

export async function refreshSelectedDemoUser() {
  if (typeof window === "undefined") {
    return;
  }

  const selectedUser = getSelectedDemoUser();

  try {
    const response = await fetch(`${apiBaseUrl}/api/security/me`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Demo-User": selectedUser.email
      }
    });

    if (!response.ok) {
      return;
    }

    const serverUser = (await response.json()) as { email: string; permissions: string[] };
    applyDemoUserPermissions(serverUser.email, serverUser.permissions);
  } catch {
    // The static role matrix remains available when the API is offline.
  }
}

function subscribeToDemoUser(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("demo-user-changed", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("demo-user-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function getDemoUserSnapshot() {
  return `${getSelectedDemoUser().email}|${demoUserVersion}`;
}

function getServerDemoUserSnapshot() {
  return defaultDemoUser.email;
}

export function useDemoUser() {
  const snapshot = useSyncExternalStore(subscribeToDemoUser, getDemoUserSnapshot, getServerDemoUserSnapshot);
  const email = snapshot.split("|")[0];
  const user = findDemoUser(email);
  const setUserByEmail = useCallback((nextEmail: string) => {
    setSelectedDemoUser(nextEmail);
  }, []);

  useEffect(() => {
    void refreshSelectedDemoUser();
  }, [email]);

  return useMemo(
    () => ({
      user,
      setUserByEmail,
      hasPermission: (permission: Permission | string) => user.permissions.includes(permission as Permission)
    }),
    [setUserByEmail, user]
  );
}
