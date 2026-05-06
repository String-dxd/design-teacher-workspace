const STORAGE_KEY = 'imported_columns'

export interface ImportedColumn {
  id: string
  label: string
}

export function getImportedColumns(): Array<ImportedColumn> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveImportedColumns(columns: Array<ImportedColumn>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
}
