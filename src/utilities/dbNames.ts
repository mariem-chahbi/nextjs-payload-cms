/** Postgres identifiers are limited to 63 characters. */
const MAX_IDENTIFIER = 63

/** FNV-1a, base36: short deterministic suffix that keeps shortened names unique. */
const hash = (input: string): string => {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** Returns the name unchanged when it fits, otherwise a truncated name plus a hash of the full one. */
export const fitIdentifier = (name: string): string => {
  if (name.length <= MAX_IDENTIFIER) return name
  const suffix = `_${hash(name)}`
  return `${name.slice(0, MAX_IDENTIFIER - suffix.length)}${suffix}`
}

export const toSnake = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
