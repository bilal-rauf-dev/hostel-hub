// Token management utilities (no external libraries)

export interface DecodedToken {
  user_id: number
  email: string
  role: 'student' | 'admin'
  exp: number
  sub?: string
}

/**
 * Save access and refresh tokens to localStorage
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('hh_access_token', accessToken)
  localStorage.setItem('hh_refresh_token', refreshToken)
}

/**
 * Clear both tokens from localStorage
 */
export function clearTokens(): void {
  localStorage.removeItem('hh_access_token')
  localStorage.removeItem('hh_refresh_token')
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('hh_access_token')
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('hh_refresh_token')
}

/**
 * Decode JWT token payload using atob (no library needed)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))

    return {
      user_id: decoded.user_id || parseInt(decoded.sub),
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp,
      sub: decoded.sub,
    }
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true

  const now = Date.now() / 1000
  return decoded.exp < now
}

/**
 * Get current user from access token
 */
export function getCurrentUser(): DecodedToken | null {
  const token = getAccessToken()
  if (!token) return null

  if (isTokenExpired(token)) {
    clearTokens()
    return null
  }

  return decodeToken(token)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false
  return !isTokenExpired(token)
}

/**
 * Check if user has admin role
 */
export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}
