import configPromise from '@payload-config'
import { getPayload as getPayloadInstance, type Payload } from 'payload'

/**
 * The single way app code gets the Local API.
 *
 * Payload already caches the initialized instance on `global` (and reloads it on HMR in dev),
 * so we delegate instead of memoizing the promise here — a module-level memo would keep a stale
 * instance after config changes in `pnpm dev`.
 */
export const getPayload = (): Promise<Payload> => getPayloadInstance({ config: configPromise })
