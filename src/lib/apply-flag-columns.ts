/**
 * Table-driven sync of flag-gated columns into a user-mutable column list.
 *
 * Each spec inserts its columns (sourced from `defaultColumns`) at an anchor
 * when its flag is enabled and the columns are absent, or removes them when
 * the flag is disabled and they are present. Anchors are resolved at apply
 * time, so a spec can anchor on a column inserted by an earlier spec in the
 * same pass. Returns `prev` (same reference) when nothing changed.
 */
export interface FlagColumnSpec {
  enabled: boolean
  ids: Array<string>
  anchorId: string
  position: 'before' | 'after'
}

export function applyFlagColumns<T extends { id: string }>(
  prev: Array<T>,
  specs: Array<FlagColumnSpec>,
  defaultColumns: Array<T>,
): Array<T> {
  let next = prev
  for (const spec of specs) {
    const has = next.some((c) => spec.ids.includes(c.id))
    if (spec.enabled && !has) {
      const cols = defaultColumns.filter((c) => spec.ids.includes(c.id))
      if (cols.length === 0) continue
      const at = next.findIndex((c) => c.id === spec.anchorId)
      const insertAt =
        at >= 0 ? (spec.position === 'after' ? at + 1 : at) : next.length
      next = [...next.slice(0, insertAt), ...cols, ...next.slice(insertAt)]
    } else if (!spec.enabled && has) {
      next = next.filter((c) => !spec.ids.includes(c.id))
    }
  }
  return next
}
