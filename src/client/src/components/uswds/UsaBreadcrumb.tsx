import Link from "next/link";

type BreadcrumbItem = {
  href?: string;
  label: string;
};

type UsaBreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function UsaBreadcrumb({ items }: UsaBreadcrumbProps) {
  return (
    <nav className="usa-breadcrumb" aria-label="Breadcrumb">
      <ol className="usa-breadcrumb__list">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li className="usa-breadcrumb__list-item" key={`${item.label}-${index}`}>
              {item.href && !isCurrent ? (
                <Link className="usa-breadcrumb__link" href={item.href}>
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
