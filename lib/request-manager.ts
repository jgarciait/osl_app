class RequestManager {
  private cache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>()
  private pendingRequests = new Map<string, Promise<any>>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Deduplicate requests - if the same key is requested multiple times,
   * return the same promise to prevent duplicate network calls
   */
  dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check if we have a valid cached result
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return Promise.resolve(cached.data)
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending
    }

    // Create new request
    const promise = fetcher()
      .then((data) => {
        // Cache the result
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
        })

        // Remove from pending requests
        this.pendingRequests.delete(key)

        return data
      })
      .catch((error) => {
        // Remove from pending requests on error
        this.pendingRequests.delete(key)
        throw error
      })

    // Store the pending request
    this.pendingRequests.set(key, promise)

    return promise
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
      this.pendingRequests.delete(key)
    } else {
      this.cache.clear()
      this.pendingRequests.clear()
    }
  }

  /**
   * Get cache size for debugging
   */
  getCacheInfo() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys()),
    }
  }
}

export { RequestManager }
