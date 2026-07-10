// Lightweight, localStorage-backed notification feed for HDP-origin events
// (results landed, reports approved), merged into the shared notification
// bell alongside Posts announcements. Modeled on hdp-cycle-store.ts's own
// defensive-load pattern — mock data, not a real notification service.

export interface HdpNotification {
  id: string
  title: string
  description: string
  createdAt: string // ISO
  read: boolean
}

const STORAGE_KEY = 'hdp_notifications'
const MAX_ENTRIES = 20

export function getHdpNotifications(): Array<HdpNotification> {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (n): n is HdpNotification =>
        typeof n === 'object' &&
        n !== null &&
        typeof n.id === 'string' &&
        typeof n.title === 'string' &&
        typeof n.description === 'string' &&
        typeof n.createdAt === 'string' &&
        typeof n.read === 'boolean',
    )
  } catch {
    return []
  }
}

export function pushHdpNotification(
  entry: Omit<HdpNotification, 'id' | 'read'>,
): void {
  if (typeof window === 'undefined') return
  try {
    const next: HdpNotification = {
      ...entry,
      id: crypto.randomUUID(),
      read: false,
    }
    const updated = [next, ...getHdpNotifications()].slice(0, MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Quota exceeded or localStorage unavailable — silently ignore
  }
}

export function markHdpNotificationsRead(): void {
  if (typeof window === 'undefined') return
  try {
    const updated = getHdpNotifications().map((n) => ({ ...n, read: true }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}
