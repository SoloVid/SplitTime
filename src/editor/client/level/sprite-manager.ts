namespace splitTime.editor.level {
    export class SpriteManager {

        private readonly collageMap: { [collageId: string]: CollageInfo } = {}

        constructor(
            private readonly server: client.ServerLiaison
        ) {}

        getCollage(collageId: string): file.Collage | null {
            if (!(collageId in this.collageMap)) {
                this.collageMap[collageId] = {
                    lastUpdated: 0,
                    isLoading: false,
                    collage: null
                }
            }
            const collageInfo = this.collageMap[collageId]
            if (!collageInfo.isLoading && collageInfo.lastUpdated < Date.now() - CACHE_LIFE) {
                this.loadCollage(collageId)
            }
            return collageInfo.collage
        }

        async loadCollage(collageId: string): Promise<void> {
            const collageInfo = this.collageMap[collageId]
            try {
                const c = await this.server.api.collageJson.fetch(this.server.withProject({ collageId }))
                collageInfo.collage = c
                collageInfo.lastUpdated = Date.now()
                collageInfo.isLoading = false
            } catch (e: unknown) {
                log.warn("Failed to load collage", e)
                collageInfo.isLoading
            }
        }
    }

    const LOADING = "LOADING_SINGLETON"
    const CACHE_LIFE = 5000

    interface CollageInfo {
        lastUpdated: number
        isLoading: boolean
        collage: file.Collage | null
    }
}