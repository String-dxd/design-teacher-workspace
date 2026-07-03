import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbContextValue {
  breadcrumbs: Array<BreadcrumbItem>
  setBreadcrumbs: (breadcrumbs: Array<BreadcrumbItem>) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [breadcrumbs, setBreadcrumbs] = useState<Array<BreadcrumbItem>>([])

  const value = useMemo(() => ({ breadcrumbs, setBreadcrumbs }), [breadcrumbs])

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider')
  }
  return context.breadcrumbs
}

export function useSetBreadcrumbs(breadcrumbs: Array<BreadcrumbItem>) {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error(
      'useSetBreadcrumbs must be used within a BreadcrumbProvider',
    )
  }

  const { setBreadcrumbs } = context

  useEffect(() => {
    setBreadcrumbs(breadcrumbs)
  }, [setBreadcrumbs, JSON.stringify(breadcrumbs)])
}
