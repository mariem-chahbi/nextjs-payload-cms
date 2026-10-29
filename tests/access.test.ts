import type { Access, FieldAccess } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  adminOrSelf,
  canAccessAdminPanel,
  contentManagers,
  contentManagersOrTranslatorInLocale,
  isTranslatableLocale,
  publishedOrLoggedIn,
} from '@/access/roles'
import { Documents } from '@/collections/Documents'
import { Media } from '@/collections/Media'
import { Regions } from '@/collections/Regions'
import { Translations } from '@/collections/Translations'
import { Users } from '@/collections/Users'

import { mockReq } from './helpers'

const run = (access: Access | undefined, role?: Parameters<typeof mockReq>[0], locale?: string) =>
  access?.({ req: mockReq(role, locale) } as never)

describe('admin panel access', () => {
  it.each([
    ['admin', true],
    ['editor', true],
    ['translator', true],
    ['viewer', false],
    [undefined, false],
  ] as const)('%s → %s', (role, expected) => {
    expect(canAccessAdminPanel({ req: mockReq(role) })).toBe(expected)
    expect(Users.access?.admin?.({ req: mockReq(role) } as never)).toBe(expected)
  })
})

describe('users collection', () => {
  it('only admins create, delete and unlock users', () => {
    for (const op of ['create', 'delete', 'unlock'] as const) {
      expect(run(Users.access?.[op], 'admin')).toBe(true)
      expect(run(Users.access?.[op], 'editor')).toBe(false)
      expect(run(Users.access?.[op], 'translator')).toBe(false)
      expect(run(Users.access?.[op], 'viewer')).toBe(false)
    }
  })

  it('non-admins only read and update themselves', () => {
    expect(run(adminOrSelf, 'admin')).toBe(true)
    expect(run(adminOrSelf, 'editor')).toEqual({ id: { equals: 1 } })
    expect(run(adminOrSelf, 'translator')).toEqual({ id: { equals: 1 } })
    expect(run(adminOrSelf)).toBe(false)
  })

  it('only admins can assign roles (no self-promotion)', () => {
    const role = Users.fields.find((f) => 'name' in f && f.name === 'role') as { access: Record<string, FieldAccess> }
    for (const op of ['create', 'update']) {
      expect(role.access[op]!({ req: mockReq('admin') } as never)).toBe(true)
      expect(role.access[op]!({ req: mockReq('editor') } as never)).toBe(false)
      expect(role.access[op]!({ req: mockReq('translator') } as never)).toBe(false)
    }
  })

  it('makes the first user an admin, later users keep their role', async () => {
    const hook = Users.hooks!.beforeChange![0]!
    const call = (count: number) =>
      hook({
        data: { email: 'a@b.c', role: 'viewer' },
        operation: 'create',
        req: { payload: { count: vi.fn().mockResolvedValue({ totalDocs: count }) } },
      } as never)
    expect(await call(0)).toMatchObject({ role: 'admin' })
    expect(await call(3)).toMatchObject({ role: 'viewer' })
  })
})

describe('content access', () => {
  it('editors and admins manage content; translators and viewers do not', () => {
    expect(run(contentManagers, 'admin')).toBe(true)
    expect(run(contentManagers, 'editor')).toBe(true)
    expect(run(contentManagers, 'translator')).toBe(false)
    expect(run(contentManagers, 'viewer')).toBe(false)
  })

  it('translators may update only in a non-default locale', () => {
    expect(run(contentManagersOrTranslatorInLocale, 'translator', 'ar')).toBe(true)
    expect(run(contentManagersOrTranslatorInLocale, 'translator', 'ar-TN')).toBe(true)
    expect(run(contentManagersOrTranslatorInLocale, 'translator', 'en-TN')).toBe(true)
    expect(run(contentManagersOrTranslatorInLocale, 'translator', 'en')).toBe(false)
    expect(run(contentManagersOrTranslatorInLocale, 'translator', 'all')).toBe(false)
    expect(run(contentManagersOrTranslatorInLocale, 'translator', undefined)).toBe(false)
    expect(run(contentManagersOrTranslatorInLocale, 'editor', 'en')).toBe(true)
    expect(run(contentManagersOrTranslatorInLocale, 'viewer', 'ar')).toBe(false)
  })

  it('isTranslatableLocale rejects missing, all, en and unknown codes', () => {
    expect([undefined, null, '', 'all', 'en', 'fr', 'ar', 'en-TN'].map(isTranslatableLocale)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      true,
    ])
  })

  it('the public only sees published documents', () => {
    expect(run(publishedOrLoggedIn)).toEqual({ _status: { equals: 'published' } })
    expect(run(publishedOrLoggedIn, 'viewer')).toBe(true)
  })

  it('translators can edit media alt text and UI strings, but never create or delete them', () => {
    for (const collection of [Media, Translations]) {
      expect(run(collection.access?.update, 'translator', 'ar')).toBe(true)
      expect(run(collection.access?.update, 'translator', 'en')).toBe(false)
      expect(run(collection.access?.create, 'translator', 'ar')).toBe(false)
      expect(run(collection.access?.delete, 'translator', 'ar')).toBe(false)
    }
  })

  it('regions are managed by editors and admins only', () => {
    expect(run(Regions.access?.update, 'editor')).toBe(true)
    expect(run(Regions.access?.update, 'translator', 'ar')).toBe(false)
    expect(run(Regions.access?.read)).toBe(true)
  })

  it('private documents require login; media is public', () => {
    expect(run(Documents.access?.read)).toBe(false)
    expect(run(Documents.access?.read, 'viewer')).toBe(true)
    expect(run(Media.access?.read)).toBe(true)
  })
})
