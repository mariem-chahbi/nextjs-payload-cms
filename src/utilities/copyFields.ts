/**
 * Deep copy of field / block configs that keeps functions (hooks, validate, conditions) by reference.
 *
 * Why: Payload sanitizes configs IN PLACE. When the same block objects are used in a localized
 * blocks field (the per-language layout), Payload strips `localized` from their sub-fields — and
 * if the shared layout uses the very same objects, its texts silently stop being localized.
 * Every blocks field must therefore get its own copy. No package imports.
 */
export const copyConfig = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(copyConfig) as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copyConfig(v)])) as T
  }
  return value // primitives, functions, class instances (e.g. RegExp)
}
