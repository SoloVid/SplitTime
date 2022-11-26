import { randomRangedInt } from "api/math"
import { warn } from "api/system"
import { Immutable } from "engine/utils/immutable"
import { ImmutableSetter } from "./preact-help"

export type UnderlyingCacheObject<T> = { [id: string]: CacheEntry<T> }

export class Cache<T> {

    // Setting this to a higher number can help ensure that cache misses don't all happen at exactly the same time
    cacheLifeRandomFactor = 0

    constructor(
        private readonly getCallback: (id: string) => (T | PromiseLike<T>),
        private readonly cacheObject: Immutable<UnderlyingCacheObject<T>>,
        private readonly setCacheObject: ImmutableSetter<UnderlyingCacheObject<T>>,
        private readonly cacheLife: number = DEFAULT_CACHE_LIFE,
    ) { }

    private getCacheEntry(id: string): Immutable<CacheEntry<T>> {
        const cacheEntry = this.cacheObject[id] ?? {
            refetchAt: 0,
            isLoading: false,
            failed: false,
            data: null
        }
        if (!(id in this.cacheObject)) {
            this.setCacheObject((before) => ({
                ...before,
                [id]: cacheEntry
            }))
        }
        if (!cacheEntry.isLoading && cacheEntry.refetchAt <= performance.now()) {
            this.updateCacheEntry(id, {isLoading: true})
            this.load(id)
        }
        if (cacheEntry.failed) {
            throw new Error("Unable to get item from cache \"" + id + "\"")
        }
        return cacheEntry
    }

    private updateCacheEntry(id: string, cacheEntry: Partial<Immutable<CacheEntry<T>>>) {
        this.setCacheObject((before) => ({
            ...before,
            [id]: {
                ...before[id],
                ...cacheEntry,
            }
        }))
    }

    /**
     * Synchronously return the item as available in the cache (null if missing).
     * If cache does not have item or is out of date, will also asynchronously load the item.
     * If there was an error while trying to load the item the last time,
     * this method will throw an exception.
     */
    get(id: string): Immutable<T> | null | never {
        return this.getCacheEntry(id).data
    }

    async load(id: string): Promise<void> {
        const cacheEntry = this.cacheObject[id]
        try {
            const data = await this.getCallback(id)
            this.updateCacheEntry(id, {
                data: data as Immutable<T>,
                failed: false
            })
        } catch (e: unknown) {
            warn("Failed to load item \"" + cacheEntry + "\" for cache", e)
            this.updateCacheEntry(id, {failed: true})
        } finally {
            this.updateCacheEntry(id, {
                refetchAt: performance.now() + this.cacheLife + randomRangedInt(-this.cacheLifeRandomFactor, this.cacheLifeRandomFactor),
                isLoading: false,
            })
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
