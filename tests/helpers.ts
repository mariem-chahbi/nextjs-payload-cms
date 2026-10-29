import type { PayloadRequest } from 'payload'

import type { Role } from '@/access/roles'

/** Minimal request object for calling access functions and hooks directly. */
export const mockReq = (role?: Role, locale?: string, extra: Partial<PayloadRequest> = {}): PayloadRequest =>
  ({
    user: role ? { id: 1, role, collection: 'users' } : null,
    locale,
    context: {},
    headers: new Headers(),
    ...extra,
  }) as unknown as PayloadRequest

export const roles: Role[] = ['admin', 'editor', 'translator', 'viewer']
