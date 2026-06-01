import Link from "next/link";

type UsaPaginationProps = {
  page: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  totalItems?: number;
  totalPages: number;
  getPageHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

function getVisiblePages(page: number, totalPages: number) {
  const candidates = new Set([1, totalPages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= totalPages));
  const sorted = Array.from(candidates).sort((a, b) => a - b);
  const pages: Array<number | "ellipsis"> = [];

  sorted.forEach((pageNumber, index) => {
    const previous = sorted[index - 1];

    if (previous && pageNumber - previous > 1) {
      pages.push("ellipsis");
    }

    pages.push(pageNumber);
  });

  return pages;
}

export function UsaPagination({
  page,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  getPageHref,
  onPageChange,
  onPageSizeChange
}: UsaPaginationProps) {
  const normalizedTotalPages = Math.max(1, totalPages);
  const visiblePages = getVisiblePages(page, normalizedTotalPages);
  const itemStart = totalItems && pageSize ? Math.min((page - 1) * pageSize + 1, totalItems) : undefined;
  const itemEnd = totalItems && pageSize ? Math.min(page * pageSize, totalItems) : undefined;

  function renderPageLink(pageNumber: number, label: string, className: string, disabled = false) {
    const sharedProps = {
      "aria-current": pageNumber === page ? ("page" as const) : undefined,
      "aria-label": pageNumber === page ? `${label}, current page` : label,
      className
    };

    if (disabled) {
      return (
        <span aria-disabled="true" className={`${className} is-disabled`}>
          {label}
        </span>
      );
    }

    if (getPageHref) {
      return (
        <Link {...sharedProps} href={getPageHref(pageNumber)}>
          {label}
        </Link>
      );
    }

    return (
      <button {...sharedProps} type="button" onClick={() => onPageChange?.(pageNumber)}>
        {label}
      </button>
    );
  }

  return (
    <nav className="app-pagination" aria-label="Risk queue pagination">
      <div className="app-pagination__controls">
        <ul className="app-pagination__list">
          <li>
            {renderPageLink(page - 1, "Previous", "app-pagination__control", page <= 1)}
          </li>
          {visiblePages.map((pageNumber, index) =>
            pageNumber === "ellipsis" ? (
              <li aria-hidden="true" className="app-pagination__ellipsis" key={`ellipsis-${index}`}>
                ...
              </li>
            ) : (
              <li key={pageNumber}>{renderPageLink(pageNumber, String(pageNumber), "app-pagination__page")}</li>
            )
          )}
          <li>
            {renderPageLink(page + 1, "Next", "app-pagination__control", page >= normalizedTotalPages)}
          </li>
        </ul>

        {pageSize && pageSizeOptions && onPageSizeChange ? (
          <label className="app-pagination__page-size" htmlFor="paginationPageSize">
            <span className="usa-sr-only">Rows per page</span>
            <select
              className="usa-select"
              id="paginationPageSize"
              name="paginationPageSize"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span aria-hidden="true">items per page</span>
          </label>
        ) : null}
      </div>

      <div className="app-pagination__meta">
        <p className="app-pagination__summary">
          {itemStart && itemEnd && totalItems ? `${itemStart} - ${itemEnd} of ${totalItems} items` : `Page ${page} of ${normalizedTotalPages}`}
        </p>
      </div>
    </nav>
  );
}
