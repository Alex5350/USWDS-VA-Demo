import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  );
}
