import { afterEach, describe, expect, it, vi } from 'vitest'
import { getImportedColumns, saveImportedColumns } from './imported-columns'
import type { ImportedColumn } from './imported-columns'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('getImportedColumns', () => {
  it('returns empty array when storage is empty', () => {
    expect(getImportedColumns()).toEqual([])
  })

  it('round-trips two columns through save and get', () => {
    const cols: Array<ImportedColumn> = [
      { id: 'col1', label: 'Column 1' },
      { id: 'col2', label: 'Column 2' },
    ]
    saveImportedColumns(cols)
    expect(getImportedColumns()).toEqual(cols)
  })

  it('returns empty array when storage contains corrupted JSON', () => {
    localStorage.setItem('imported_columns', '{nope')
    expect(getImportedColumns()).toEqual([])
  })

  it('returns empty array when storage contains a non-array JSON value', () => {
    localStorage.setItem('imported_columns', '42')
    expect(getImportedColumns()).toEqual([])
  })

  it('filters out malformed entries, keeping only well-formed ones', () => {
    const raw = JSON.stringify([{ id: 'a', label: 'A' }, { id: 7 }, null])
    localStorage.setItem('imported_columns', raw)
    expect(getImportedColumns()).toEqual([{ id: 'a', label: 'A' }])
  })
})

describe('saveImportedColumns', () => {
  it('does not throw when setItem throws a quota error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => saveImportedColumns([{ id: 'x', label: 'X' }])).not.toThrow()
  })
})
