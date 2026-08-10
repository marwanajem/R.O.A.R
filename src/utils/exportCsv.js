// Shared CSV export utility — converts an array of row objects to a downloadable .csv file.
// columns: [{ key, header }]  — defines column order and headers
// rows: array of objects

export function exportCsv(filename, columns, rows) {
  const header = columns.map((c) => c.header).join(',')
  const body = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key] ?? ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )
  const csv = [header, ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
