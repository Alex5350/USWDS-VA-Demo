"use client";

import { useEffect, useMemo, useState } from "react";

import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { UsaTable } from "@/components/uswds/UsaTable";
import {
  getAuditEvents,
  getDemoPermissionUsers,
  type AuditEvent,
  type DemoUserPermissionSummary,
  updateDemoUserPermissions
} from "@/lib/api-client";
import { applyDemoUserPermissions, demoUsers, type DemoUser, type Permission, useDemoUser } from "@/lib/demo-auth";
import { formatDate } from "@/lib/formatters";

const capabilities: { label: string; permission: Permission }[] = [
  { label: "View dashboard", permission: "CanViewDashboard" },
  { label: "View risk queue", permission: "CanViewRiskQueue" },
  { label: "View case detail", permission: "CanViewCaseDetail" },
  { label: "Add case note", permission: "CanAddCaseNote" },
  { label: "Change case status", permission: "CanChangeCaseStatus" },
  { label: "Mark case referred", permission: "CanReferCase" },
  { label: "Create risk record", permission: "CanCreateRiskRecord" },
  { label: "Escalate risk record", permission: "CanEscalateRiskRecord" },
  { label: "Edit risk rules", permission: "CanEditRiskRules" },
  { label: "Export reports", permission: "CanExportReports" },
  { label: "View admin/security page", permission: "CanViewAdmin" },
  { label: "Manage demo permissions", permission: "CanManageDemoPermissions" },
  { label: "View audit events", permission: "CanViewAudit" },
  { label: "Manage providers", permission: "CanManageProviders" },
  { label: "Manage procedure codes", permission: "CanManageProcedureCodes" }
];

type RoleMatrixRow = {
  capability: string;
  users: DemoUser[];
  permission: Permission;
};

function toMatrixUsers(permissionUsers: DemoUserPermissionSummary[]): DemoUser[] {
  if (permissionUsers.length === 0) {
    return demoUsers;
  }

  return permissionUsers.map((user) => ({
    email: user.email,
    displayName: user.displayName,
    role: (user.roles[0] ?? "ReadOnly") as DemoUser["role"],
    permissions: user.effectivePermissions as Permission[]
  }));
}

export function AdminSecurityView() {
  const { user, hasPermission } = useDemoUser();
  const [permissionUsers, setPermissionUsers] = useState<DemoUserPermissionSummary[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("demo.analyst@local");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [message, setMessage] = useState("Loading security administration data.");

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      if (!hasPermission("CanViewAdmin")) {
        return;
      }

      const [users, audit] = await Promise.all([getDemoPermissionUsers(), getAuditEvents()]);

      if (isMounted) {
        setPermissionUsers(users);
        setAuditEvents(audit);
        const firstEditableUser = users.find((demoUser) => demoUser.email !== user.email) ?? users[0];
        if (firstEditableUser) {
          setSelectedEmail(firstEditableUser.email);
          setSelectedPermissions(firstEditableUser.effectivePermissions);
        }
        setMessage("Security administration data loaded.");
      }
    }

    void loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [hasPermission, user.email]);

  const selectedUser = permissionUsers.find((permissionUser) => permissionUser.email === selectedEmail);
  const matrixRows: RoleMatrixRow[] = useMemo(() => {
    const matrixUsers = toMatrixUsers(permissionUsers);
    return capabilities.map((capability) => ({
      capability: capability.label,
      permission: capability.permission,
      users: matrixUsers
    }));
  }, [permissionUsers]);

  if (!hasPermission("CanViewAdmin")) {
    return (
      <div className="page-stack">
        <UsaAlert heading="Administrator role required" type="warning">
          This route is visible in navigation only for Administrator. Switch to the demo Administrator role to review
          the mock authentication and authorization details.
        </UsaAlert>
      </div>
    );
  }

  function handleSelectedUserChange(email: string) {
    const nextUser = permissionUsers.find((permissionUser) => permissionUser.email === email);
    setSelectedEmail(email);
    setSelectedPermissions(nextUser?.effectivePermissions ?? []);
  }

  function togglePermission(permission: string) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((currentPermission) => currentPermission !== permission)
        : [...current, permission]
    );
  }

  async function handleSavePermissions() {
    if (!selectedUser || !hasPermission("CanManageDemoPermissions")) {
      return;
    }

    const updatedUser = await updateDemoUserPermissions(selectedUser.email, selectedPermissions);
    setPermissionUsers((current) =>
      current.map((permissionUser) => (permissionUser.email === updatedUser.email ? updatedUser : permissionUser))
    );
    applyDemoUserPermissions(updatedUser.email, updatedUser.effectivePermissions);
    setSelectedPermissions(updatedUser.effectivePermissions);
    setAuditEvents(await getAuditEvents());
    setMessage(`Updated demo permissions for ${updatedUser.email}.`);
  }

  return (
    <div className="page-stack">
      <UsaAlert heading="Mock authentication only" type="warning">
        This demo uses a header-based role selector for interview purposes. It is not production identity management and
        does not store passwords.
      </UsaAlert>

      <p className="status-text" aria-live="polite">
        {message}
      </p>

      <section className="detail-grid" aria-label="Current user and security model">
        <div className="panel">
          <h2>Current Mock User</h2>
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Display name</dt>
              <dd>{user.displayName}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>Permissions</dt>
              <dd>{user.permissions.join(", ")}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h2>Production Identity Out of Scope</h2>
          <ul className="usa-list">
            <li>No real VA SSO, Login.gov, PIV/CAC, Entra ID, or OAuth tenant is configured.</li>
            <li>The frontend stores only the selected demo email in browser session storage.</li>
            <li>The API maps <code>X-Demo-User</code> to server-side claims and policy permissions.</li>
            <li>Permission overrides are synthetic demo data and are not production user provisioning.</li>
          </ul>
        </div>
      </section>

      <section className="panel" aria-labelledby="permission-admin-heading">
        <h2 id="permission-admin-heading">Demo Permission Assignment</h2>
        {!hasPermission("CanManageDemoPermissions") ? (
          <UsaAlert slim type="info">
            Current demo role can view this page but cannot assign permissions.
          </UsaAlert>
        ) : null}
        <div className="filter-grid">
          <UsaFormGroup id="permission-user" label="Demo user">
            <select
              className="usa-select"
              id="permission-user"
              name="permission-user"
              value={selectedEmail}
              onChange={(event) => handleSelectedUserChange(event.target.value)}
            >
              {permissionUsers.map((permissionUser) => (
                <option key={permissionUser.email} value={permissionUser.email}>
                  {permissionUser.roles.join(", ")} - {permissionUser.email}
                </option>
              ))}
            </select>
          </UsaFormGroup>
        </div>

        <fieldset className="usa-fieldset rule-checkbox-grid">
          <legend className="usa-legend">Assigned permissions</legend>
          {capabilities.map((capability) => (
            <div className="usa-checkbox" key={capability.permission}>
              <input
                checked={selectedPermissions.includes(capability.permission)}
                className="usa-checkbox__input"
                disabled={!hasPermission("CanManageDemoPermissions")}
                id={`assign-${capability.permission}`}
                name="assignedPermissions"
                type="checkbox"
                value={capability.permission}
                onChange={() => togglePermission(capability.permission)}
              />
              <label className="usa-checkbox__label" htmlFor={`assign-${capability.permission}`}>
                {capability.label}
              </label>
            </div>
          ))}
        </fieldset>

        <UsaButton disabled={!hasPermission("CanManageDemoPermissions") || !selectedUser} type="button" onClick={handleSavePermissions}>
          Save permissions
        </UsaButton>
      </section>

      <section className="panel" aria-labelledby="role-matrix-heading">
        <h2 id="role-matrix-heading">Role Permission Matrix</h2>
        <UsaTable
          caption="Demo role permissions by capability"
          columns={[
            { key: "capability", header: "Capability", render: (row) => row.capability },
            {
              key: "readonly",
              header: "ReadOnly",
              render: (row) =>
                row.users.find((matrixUser) => matrixUser.role === "ReadOnly")?.permissions.includes(row.permission)
                  ? "Yes"
                  : "No"
            },
            {
              key: "analyst",
              header: "Analyst",
              render: (row) =>
                row.users.find((matrixUser) => matrixUser.role === "Analyst")?.permissions.includes(row.permission)
                  ? "Yes"
                  : "No"
            },
            {
              key: "investigator",
              header: "Investigator",
              render: (row) =>
                row.users
                  .find((matrixUser) => matrixUser.role === "Investigator")
                  ?.permissions.includes(row.permission)
                  ? "Yes"
                  : "No"
            },
            {
              key: "supervisor",
              header: "Supervisor",
              render: (row) =>
                row.users.find((matrixUser) => matrixUser.role === "Supervisor")?.permissions.includes(row.permission)
                  ? "Yes"
                  : "No"
            },
            {
              key: "administrator",
              header: "Administrator",
              render: (row) =>
                row.users
                  .find((matrixUser) => matrixUser.role === "Administrator")
                  ?.permissions.includes(row.permission)
                  ? "Yes"
                  : "No"
            }
          ]}
          rows={matrixRows}
          getRowKey={(row) => row.capability}
        />
      </section>

      <section className="panel" aria-labelledby="audit-heading">
        <h2 id="audit-heading">Audit Events</h2>
        {!hasPermission("CanViewAudit") ? (
          <UsaAlert slim type="info">
            Current demo role cannot view audit events.
          </UsaAlert>
        ) : (
          <UsaTable
            caption="Recent demo audit events"
            columns={[
              { key: "createdAt", header: "Date", render: (row) => formatDate(row.createdAt) },
              { key: "actor", header: "Actor", render: (row) => row.actorEmail },
              { key: "action", header: "Action", render: (row) => row.action },
              { key: "target", header: "Target", render: (row) => `${row.targetType} ${row.targetId}` },
              { key: "summary", header: "Summary", render: (row) => row.summary }
            ]}
            rows={auditEvents}
            getRowKey={(row) => row.auditEventId}
          />
        )}
      </section>
    </div>
  );
}
