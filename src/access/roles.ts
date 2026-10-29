import type { Access, PayloadRequest } from 'payload'

import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales'

export const ROLES = ['admin', 'editor', 'translator', 'viewer'] as const
export type Role = (typeof ROLES)[number]

type MaybeUser = { id?: number | string; role?: Role | null } | null | undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.role && roles.includes(user.role))

export const isAdmin = (user: MaybeUser) => hasRole(user, 'admin')
export const isContentManager = (user: MaybeUser) => hasRole(user, 'admin', 'editor')
export const isTranslator = (user: MaybeUser) => hasRole(user, 'translator')

/**
 * Locales a translator may write: any configured locale except the default one.
 * Missing, 'all' or 'en' → no.
 */
export const isTranslatableLocale = (locale: unknown): boolean =>
  isLocale(locale) && locale !== DEFAULT_LOCALE

const userOf = (req: Pick<PayloadRequest, 'user'>) => req.user as MaybeUser

// ── Building blocks for collection / global access ─────────────────────────────

export const anyone: Access = () => true
export const loggedIn: Access = ({ req }) => Boolean(req.user)
export const adminsOnly: Access = ({ req }) => isAdmin(userOf(req))
export const contentManagers: Access = ({ req }) => isContentManager(userOf(req))

/** Admin panel: everyone but viewers. Viewers can still log in to the API and read. */
export const canAccessAdminPanel = ({ req }: { req: Pick<PayloadRequest, 'user'> }): boolean =>
  hasRole(userOf(req), 'admin', 'editor', 'translator')

/** Editors and admins always; translators only while working in a non-default locale. */
export const contentManagersOrTranslatorInLocale: Access = ({ req }) => {
  const user = userOf(req)
  if (isContentManager(user)) return true
  return isTranslator(user) && isTranslatableLocale(req.locale)
}

/** Drafts are visible to logged-in users; the public only sees published documents. */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

/** Admins see every user; everyone else only sees themselves. */
export const adminOrSelf: Access = ({ req }) => {
  const user = userOf(req)
  if (!user) return false
  if (isAdmin(user)) return true
  return { id: { equals: user.id } }
}
