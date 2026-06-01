import type { ReactNode } from "react";

type UsaFormGroupProps = {
  className?: string;
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function UsaFormGroup({ className, id, label, hint, error, children }: UsaFormGroupProps) {
  const formGroupClassName = ["usa-form-group", error ? "usa-form-group--error" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={formGroupClassName}>
      <label className={`usa-label${error ? " usa-label--error" : ""}`} htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <span className="usa-hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="usa-error-message" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
      {children}
    </div>
  );
}
