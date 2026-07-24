import * as React from 'react'

const AUTH_STORAGE_KEY = 'tw_mock_auth'
export const AUTH_COOKIE_KEY = 'auth_session'

// Static password for demo purposes only — this prototype has no real auth.
// Shared by both guest sign-in routes (/login and /student-login) so the demo
// password is the single gate, not one screen that enforces it and one that
// silently lets anyone in.
export const DEMO_PASSWORD = 'dxd2026'

// Routes reachable without being signed in. Everything else redirects to the
// login screen until the demo password has been entered. This is the SINGLE
// source of truth for "is this route public" — the server-side root loader and
// the client-side shell gate both consume it, so there is no second, hand-synced
// list to drift out of sync.
export const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/student-login',
  '/create',
  '/hdp-report',
  '/hdp-student',
  '/glow',
]

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

interface User {
  name: string
  email: string
  role: string
  avatar: string | null
}

const MOCK_USER: User = {
  name: 'Daniel Tan',
  email: 'daniel_tan@school.moe.sg',
  role: 'Teacher',
  avatar: null,
}

interface AuthContextValue {
  isLoggedIn: boolean
  user: User
  login: () => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function loadAuth(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(AUTH_STORAGE_KEY) === 'true') return true
  } catch {}
  try {
    // localStorage is the client authority — it persists across tabs and
    // browser restarts. The per-browser session cookie is the SSR-readable
    // mirror (the server loader cannot read localStorage) and the fallback
    // when localStorage is unavailable (private mode / blocked storage).
    return document.cookie.split('; ').includes(`${AUTH_COOKIE_KEY}=true`)
  } catch {
    return false
  }
}

export function AuthProvider({
  children,
  initialLoggedIn = false,
}: {
  children: React.ReactNode
  /**
   * Server-computed seed (from the root loader's cookie read) used to
   * initialize state so the first client render matches the SSR HTML —
   * no post-mount "Sign in" flash for a logged-in user.
   */
  initialLoggedIn?: boolean
}) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(initialLoggedIn)
  const [user, setUser] = React.useState<User>(MOCK_USER)

  React.useEffect(() => {
    setIsLoggedIn(loadAuth())

    // Propagate login/logout across tabs. A localStorage write fires a
    // `storage` event in every OTHER tab, so signing out here revokes access
    // in the other open tabs (and signing in there signs in here). Without
    // this an already-open tab would keep stale access until reloaded.
    function onStorage(event: StorageEvent) {
      if (event.key === AUTH_STORAGE_KEY || event.key === null) {
        setIsLoggedIn(loadAuth())
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = React.useCallback(() => {
    setIsLoggedIn(true)
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true')
    } catch {}
    try {
      // Mirror the login into a cookie so the server loader can gate the first
      // full-document request. Give it a max-age matching localStorage's
      // persistence (survives browser restart) — a session cookie would expire
      // on close while localStorage stayed 'true', bouncing a "still logged in"
      // user to /login on their next full load. Acceptable for this prototype's
      // mock auth — not a security boundary.
      document.cookie = `${AUTH_COOKIE_KEY}=true; path=/; samesite=lax; max-age=${
        60 * 60 * 24 * 30
      }`
    } catch {}
  }, [])

  const logout = React.useCallback(() => {
    setIsLoggedIn(false)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {}
    try {
      document.cookie = `${AUTH_COOKIE_KEY}=; path=/; samesite=lax; max-age=0`
    } catch {}
  }, [])

  const updateUser = React.useCallback((updates: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }, [])

  const value = React.useMemo(
    () => ({ isLoggedIn, user, login, logout, updateUser }),
    [isLoggedIn, user, login, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
