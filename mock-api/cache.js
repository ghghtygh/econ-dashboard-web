/**
 * Simple in-memory TTL cache.
 * Prevents hammering external rate-limited APIs on every request.
 */

const store = new Map()

/**
 * Get a cached value. Returns undefined if missing or expired.
 * @param {string} key
 */
export function get(key) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

/**
 * Set a value with a TTL.
 * @param {string} key
 * @param {*}      value
 * @param {number} ttlMs  - milliseconds until expiry
 */
export function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

/**
 * Get-or-fetch: returns cached value, or calls loader() and caches result.
 * On loader failure, returns stale data (if any) and logs a warning.
 *
 * @param {string}   key
 * @param {number}   ttlMs
 * @param {Function} loader  - async () => value
 */
export async function getOrFetch(key, ttlMs, loader) {
  const cached = get(key)
  if (cached !== undefined) return cached

  try {
    const value = await loader()
    set(key, value, ttlMs)
    return value
  } catch (err) {
    // return stale data if we have it (ignore TTL)
    const stale = store.get(key)
    if (stale) {
      console.warn(`[cache] loader failed for "${key}", returning stale data. Error: ${err.message}`)
      return stale.value
    }
    throw err
  }
}

/** Delete a cache entry. */
export function invalidate(key) {
  store.delete(key)
}

/** Clear all entries. */
export function clear() {
  store.clear()
}
