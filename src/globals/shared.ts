import type { GlobalConfig } from 'payload'

import { anyone, contentManagersOrTranslatorInLocale, loggedIn } from '@/access/roles'
import { revalidateGlobal } from '@/hooks/revalidate'

/** Drafts with autosave, version history/restore and scheduled publish, shared by every global. */
export const globalVersions: GlobalConfig['versions'] = {
  max: 50,
  drafts: {
    autosave: { interval: 800 },
    schedulePublish: true,
  },
}

export const globalAccess: GlobalConfig['access'] = {
  read: anyone,
  readVersions: loggedIn,
  update: contentManagersOrTranslatorInLocale,
}

/** Expire the site cache for this global after every save. */
export const globalHooks: GlobalConfig['hooks'] = {
  afterChange: [revalidateGlobal],
}
