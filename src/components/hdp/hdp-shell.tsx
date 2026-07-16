import { useFeatureFlag } from '@/hooks/use-feature-flag'

// Mount point for the module-wide FAB + Tag Queue overlay provider — plan
// 029 gives this its real content. Kept as a no-op placeholder here so
// __root.tsx only needs to be touched once, in this plan.
export function HdpShell() {
  const enabled = useFeatureFlag('reports-hdp')
  if (!enabled) return null
  return null
}
