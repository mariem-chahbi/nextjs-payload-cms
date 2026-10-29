import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, PayloadRequest } from 'payload'

/**
 * GET /api/playground/stats — one raw SQL query through Drizzle (`payload.db.drizzle`),
 * bypassing the Local API, to prove direct database access works. Logged-in users only.
 */
export const statsEndpoint: Endpoint = {
  path: '/playground/stats',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!req.user) {
      return Response.json({ error: 'Log in to /admin first.' }, { status: 401 })
    }

    const result = await req.payload.db.drizzle.execute(sql`
      select
        (select count(*)::int from users) as users,
        (select coalesce(json_object_agg(role, n), '{}'::json)
           from (select role, count(*)::int as n from users group by role) r) as users_by_role,
        (select count(*)::int from pages) as pages,
        (select coalesce(json_object_agg(coalesce(_status::text, 'none'), n), '{}'::json)
           from (select _status, count(*)::int as n from pages group by _status) s) as pages_by_status,
        (select count(*)::int from _pages_v) as page_versions,
        (select count(*)::int from media) as media_files,
        (select coalesce(sum(filesize), 0)::bigint from media) as media_bytes,
        (select count(*)::int from documents) as documents,
        (select count(*)::int from regions where active) as active_regions,
        (select count(*)::int from translations) as ui_string_keys,
        (select coalesce(json_object_agg(_locale, n), '{}'::json)
           from (select _locale, count(*)::int as n from translations_locales
                 where coalesce(value, '') <> '' group by _locale) t) as ui_strings_translated_by_locale,
        current_database() as database,
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        split_part(version(), ' on ', 1) as postgres_version,
        now() as generated_at
    `)

    return Response.json({ source: 'payload.db.drizzle (raw SQL)', stats: result.rows[0] ?? null })
  },
}
