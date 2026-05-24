import type { AuthUser } from '../types/api'

export const ADMIN_EMAIL = 'contact.applimanagement@gmail.com'

export function isAdminUser(user: AuthUser | null): boolean {
  return !!user && user.email.trim().toLowerCase() === ADMIN_EMAIL
}
