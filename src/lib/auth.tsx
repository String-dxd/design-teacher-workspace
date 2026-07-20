import * as React from 'react'

const AUTH_STORAGE_KEY = 'tw_mock_auth'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [user, setUser] = React.useState<User>(MOCK_USER)

  React.useEffect(() => {
    setIsLoggedIn(loadAuth())
  }, [])

  const login = React.useCallback(() => {
    setIsLoggedIn(true)
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
    } catch {}
  }, [])

  const logout = React.useCallback(() => {
    setIsLoggedIn(false)
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
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
