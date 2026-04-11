import type { ReactNode } from "react";
import { Card } from "@kunda/ui";

export type DataColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  title: string;
  description?: string;
  columns: DataColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage: string;
};

export function DataTable<T>({
  columns,
  description,
  emptyMessage,
  getRowId,
  rows,
  title,
}: DataTableProps<T>) {
  return (
    <Card title={title} eyebrow={description}>
      {rows.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={getRowId(row)}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
