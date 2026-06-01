import type { ReactNode } from "react";

type AlertType = "info" | "warning" | "success" | "error";

type UsaAlertProps = {
  type?: AlertType;
  heading?: string;
  children: ReactNode;
  slim?: boolean;
};

export function UsaAlert({ type = "info", heading, children, slim = false }: UsaAlertProps) {
  return (
    <section className={`usa-alert usa-alert--${type}${slim ? " usa-alert--slim" : ""}`}>
      <div className="usa-alert__body">
        {heading ? <h2 className="usa-alert__heading">{heading}</h2> : null}
        <div className="usa-alert__text">{children}</div>
      </div>
    </section>
  );
}
