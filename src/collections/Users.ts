import type { CollectionConfig, FieldAccess } from 'payload'

import { adminOrSelf, adminsOnly, canAccessAdminPanel, isAdmin, ROLES, type Role } from '@/access/roles'
import { l } from '@/i18n/labels'

const ROLE_LABELS: Record<Role, Record<'en' | 'ar', string>> = {
  admin: l('Admin', 'مدير'),
  editor: l('Editor', 'محرر'),
  translator: l('Translator', 'مترجم'),
  viewer: l('Viewer', 'مشاهد'),
}

const onlyAdmins: FieldAccess = ({ req }) => isAdmin(req.user as never)

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: l('User', 'مستخدم'), plural: l('Users', 'المستخدمون') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: l('Admin', 'الإدارة'),
  },
  auth: {
    // Forgot-password emails are sent through the email adapter (Mailpit in dev).
    forgotPassword: {
      expiration: 1000 * 60 * 60,
    },
  },
  access: {
    admin: canAccessAdminPanel,
    create: adminsOnly,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: adminsOnly,
    unlock: adminsOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: l('Name', 'الاسم'),
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      saveToJWT: true,
      label: l('Role', 'الدور'),
      options: ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
      access: {
        // Nobody can promote themselves; only admins assign roles.
        create: onlyAdmins,
        update: onlyAdmins,
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      // The very first account (created on /admin/create-first-user) becomes an admin.
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) return { ...data, role: 'admin' }
        return data
      },
    ],
  },
}
