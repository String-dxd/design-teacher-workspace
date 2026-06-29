import { useCallback, useEffect, useState } from 'react'

import type { ProfileGroup } from '@/types/profile-group'

const GROUPS_KEY = 'profile-groups'
const APPLIED_KEY = 'profile-groups-applied'
const EVENT = 'profile-groups-changed'

function readGroups(): Array<ProfileGroup> {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(GROUPS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Array<ProfileGroup>) : []
  } catch {
    return []
  }
}

function writeGroups(groups: Array<ProfileGroup>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    // ignore quota errors
  }
}

function readApplied(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(APPLIED_KEY)
  } catch {
    return null
  }
}

function writeApplied(id: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (id === null) window.localStorage.removeItem(APPLIED_KEY)
    else window.localStorage.setItem(APPLIED_KEY, id)
    window.dispatchEvent(new Event(EVENT))
  } catch {
    // ignore
  }
}

export function loadProfileGroups(): Array<ProfileGroup> {
  return readGroups()
}

export function saveProfileGroup(group: ProfileGroup) {
  const groups = readGroups()
  const idx = groups.findIndex((g) => g.id === group.id)
  if (idx === -1) groups.push(group)
  else groups[idx] = group
  writeGroups(groups)
}

export function deleteProfileGroup(id: string) {
  const groups = readGroups().filter((g) => g.id !== id)
  writeGroups(groups)
  if (readApplied() === id) writeApplied(null)
}

export function getAppliedProfileGroupId(): string | null {
  return readApplied()
}

export function setAppliedProfileGroupId(id: string | null) {
  writeApplied(id)
}

export function useProfileGroups() {
  const [groups, setGroups] = useState<Array<ProfileGroup>>(() => readGroups())
  const [appliedId, setAppliedIdState] = useState<string | null>(() =>
    readApplied(),
  )

  useEffect(() => {
    const sync = () => {
      setGroups(readGroups())
      setAppliedIdState(readApplied())
    }
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const save = useCallback((group: ProfileGroup) => saveProfileGroup(group), [])
  const remove = useCallback((id: string) => deleteProfileGroup(id), [])
  const apply = useCallback(
    (id: string | null) => setAppliedProfileGroupId(id),
    [],
  )

  const appliedGroup = appliedId
    ? (groups.find((g) => g.id === appliedId) ?? null)
    : null

  return { groups, appliedId, appliedGroup, save, remove, apply }
}
