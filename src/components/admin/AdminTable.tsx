interface Column {
  key: string
  label: string
  width?: string
}

interface Props {
  columns: Column[]
  rows: Record<string, unknown>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: Record<string, unknown>) => void
  renderCell?: (row: Record<string, unknown>, columnKey: string) => React.ReactNode
}

export default function AdminTable({ columns, rows, loading = false, emptyMessage = 'No results found', onRowClick, renderCell }: Props) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #DDE3E8', backgroundColor: '#F4F6F8' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600,
                    color: '#5C7080', textTransform: 'uppercase', letterSpacing: '0.04em',
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3', fontSize: '13px' }}>
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3', fontSize: '13px' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={(row.id as string) ?? i}
                  onClick={() => onRowClick?.(row)}
                  style={{ borderBottom: i < rows.length - 1 ? '1px solid #EEEEEE' : 'none', cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332', verticalAlign: 'middle' }}>
                      {renderCell ? renderCell(row, col.key) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
