import * as React from 'react'

const AUTH_STORAGE_KEY = 'tw_mock_auth'
export const AUTH_COOKIE_KEY = 'auth_session'

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
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
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
  }, [])

  const login = React.useCallback(() => {
    setIsLoggedIn(true)
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
    } catch {}
    try {
      // Session cookie (no max-age) mirrors sessionStorage's session
      // lifetime, though the scopes differ: sessionStorage is per-tab, a
      // cookie without max-age is per-browser-session. Acceptable for this
      // prototype's mock auth — not a security boundary.
      document.cookie = `${AUTH_COOKIE_KEY}=true; path=/; samesite=lax`
    } catch {}
  }, [])

  const logout = React.useCallback(() => {
    setIsLoggedIn(false)
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
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
