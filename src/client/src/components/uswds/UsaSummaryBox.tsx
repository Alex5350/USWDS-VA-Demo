import type { ReactNode } from "react";

type UsaSummaryBoxProps = {
  heading: string;
  value?: string;
  children?: ReactNode;
};

export function UsaSummaryBox({ heading, value, children }: UsaSummaryBoxProps) {
  return (
    <section className="usa-summary-box" aria-labelledby={`summary-${heading.replaceAll(" ", "-").toLowerCase()}`}>
      <div className="usa-summary-box__body">
        <h2 className="usa-summary-box__heading" id={`summary-${heading.replaceAll(" ", "-").toLowerCase()}`}>
          {heading}
        </h2>
        {value ? <p className="font-sans-xl text-bold margin-y-1">{value}</p> : null}
        {children ? <div className="usa-summary-box__text">{children}</div> : null}
      </div>
    </section>
  );
}
