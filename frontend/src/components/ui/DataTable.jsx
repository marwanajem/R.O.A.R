import React from 'react'

/**
 * DataTable — styled table with UPPERCASE mono headers
 * columns: [{ key, label, className?, render? }]
 * rows: array of objects
 */
export default function DataTable({ columns, rows, emptyMessage = 'No records found.', className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.headerClassName || ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8"
                style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map((col) => (
                  <td key={col.key} className={col.className || ''}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
