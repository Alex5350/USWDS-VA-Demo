import Link from "next/link";
import type { ReactNode } from "react";

type UsaHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function UsaHeader({ title, children }: UsaHeaderProps) {
  return (
    <header className="usa-header usa-header--basic" role="banner">
      <div className="usa-nav-container">
        <div className="usa-navbar">
          <div className="usa-logo" id="basic-logo">
            <em className="usa-logo__text">
              <Link href="/" aria-label={`${title} home`}>
                {title}
              </Link>
            </em>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
