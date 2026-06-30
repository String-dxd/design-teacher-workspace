import * as React from 'react'

const MOBILE_BREAKPOINT = 1024
const TABLET_BREAKPOINT = 768

// Treat < 1024 as "mobile" for layout consumers that want a single compact
// breakpoint (e.g. the HeyTalia panel, entity selector).
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}

// Phone (< 768px): the sidebar uses its off-canvas drawer here.
export function useIsPhone() {
  const [isPhone, setIsPhone] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsPhone(window.innerWidth < TABLET_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsPhone(window.innerWidth < TABLET_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isPhone
}

// Tablet (768px–1023px): the sidebar shows its collapsed icon rail here.
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${TABLET_BREAKPOINT}px) and (max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    )
    const onChange = () => setIsTablet(mql.matches)
    mql.addEventListener('change', onChange)
    setIsTablet(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isTablet
}
