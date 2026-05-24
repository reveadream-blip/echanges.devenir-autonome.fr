import type { AuthUser } from '../types/api'

export type AuthState = {
  user: AuthUser | null
  ready: boolean
  reload: () => Promise<void>
  logout: () => Promise<void>
}
