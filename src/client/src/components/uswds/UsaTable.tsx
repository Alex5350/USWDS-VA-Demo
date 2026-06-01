import type { ReactNode } from "react";

type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  scope?: "row" | "col";
  className?: string;
};

type UsaTableProps<T> = {
  caption: string;
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
};

export function UsaTable<T>({ caption, columns, rows, getRowKey }: UsaTableProps<T>) {
  return (
    <div className="table-scroll">
      <table className="usa-table usa-table--striped">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.className} key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column, index) => {
                const content = column.render(row);
                return index === 0 || column.scope === "row" ? (
                  <th className={column.className} key={column.key} scope="row">
                    {content}
                  </th>
                ) : (
                  <td className={column.className} key={column.key}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
