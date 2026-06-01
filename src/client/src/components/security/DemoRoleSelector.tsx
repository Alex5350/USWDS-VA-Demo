"use client";

import { demoUsers, useDemoUser } from "@/lib/demo-auth";

export function DemoRoleSelector() {
  const { user, setUserByEmail } = useDemoUser();

  return (
    <div className="demo-role-selector">
      <label className="usa-label" htmlFor="demo-role-selector">
        Demo role
      </label>
      <select
        className="usa-select"
        id="demo-role-selector"
        name="demo-role-selector"
        value={user.email}
        onChange={(event) => setUserByEmail(event.target.value)}
      >
        {demoUsers.map((demoUser) => (
          <option key={demoUser.email} value={demoUser.email}>
            {demoUser.role} - {demoUser.email}
          </option>
        ))}
      </select>
      <p className="demo-role-selector__current">
        Current user: <strong>{user.displayName}</strong> ({user.role})
      </p>
    </div>
  );
}
