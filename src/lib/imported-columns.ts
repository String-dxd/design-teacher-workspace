const STORAGE_KEY = 'imported_columns'

export interface ImportedColumn {
  id: string
  label: string
}

export function getImportedColumns(): Array<ImportedColumn> {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (c): c is ImportedColumn =>
        typeof c === 'object' &&
        c !== null &&
        typeof (c as Record<string, unknown>).id === 'string' &&
        typeof (c as Record<string, unknown>).label === 'string',
    )
  } catch {
    return []
  }
}

export function saveImportedColumns(columns: Array<ImportedColumn>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
  } catch {
    // ignore quota errors
  }
}
