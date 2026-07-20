/** '17 Jul 2026' (default) or '17 Jul' with { year: false }; undefined → '—'. */
export function formatDate(
  iso: string | undefined,
  opts?: { year?: boolean },
): string {
  if (!iso) return '—'
  const showYear = opts?.year ?? true
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    ...(showYear ? { year: 'numeric' as const } : {}),
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
