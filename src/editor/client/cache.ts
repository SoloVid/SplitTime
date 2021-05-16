namespace splitTime {
    export class Cache<T> {

        private readonly cache: { [id: string]: CacheEntry<T> } = {}
        // Setting this to a higher number can help ensure that cache misses don't all happen at exactly the same time
        cacheLifeRandomFactor = 0

        constructor(
            private readonly getCallback: (id: string) => (T | PromiseLike<T>),
            private readonly cacheLife: number = DEFAULT_CACHE_LIFE
        ) {}

        private getCacheEntry(id: string): CacheEntry<T> {
            if (!(id in this.cache)) {
                MaybeVue.set(this.cache, id, {
                    refetchAt: 0,
                    isLoading: false,
                    failed: false,
                    data: null
                })
            }
            const collageInfo = this.cache[id]
            if (!collageInfo.isLoading && collageInfo.refetchAt <= performance.now()) {
                collageInfo.isLoading = true
                this.load(id)
            }
            if (collageInfo.failed) {
                throw new Error("Unable to get item from cache \"" + id + "\"")
            }
            return collageInfo
        }

        /**
         * Synchronously return the item as available in the cache (null if missing).
         * If cache does not have item or is out of date, will also asynchronously load the item.
         * If there was an error while trying to load the item the last time,
         * this method will throw an exception.
         */
        get(id: string): T | null | never {
            return this.getCacheEntry(id).data
        }

        async load(id: string): Promise<void> {
            const cacheEntry = this.cache[id]
            try {
                cacheEntry.data = await this.getCallback(id)
                cacheEntry.failed = false
            } catch (e: unknown) {
                log.warn("Failed to load item \"" + cacheEntry + "\" for cache", e)
                cacheEntry.failed = true
            } finally {
                cacheEntry.refetchAt = performance.now() + this.cacheLife + splitTime.randomRangedInt(-this.cacheLifeRandomFactor, this.cacheLifeRandomFactor)
                cacheEntry.isLoading = false
            }
        }
    }

    const DEFAULT_CACHE_LIFE = 30 * 1000

    interface CacheEntry<T> {
        refetchAt: number
        isLoading: boolean
        failed: boolean
        data: T | null
    }
}