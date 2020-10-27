namespace splitTime.editor.level {
    export class CollageManager {

        // This field is designed to help get around Vue missing changes to collageMap
        private collageMapChangeTrigger = 1
        private readonly collageMap: { [collageId: string]: CollageInfo } = {}

        constructor(
            private readonly server: client.ServerLiaison
        ) {}

        private getCollageInfo(collageId: string): CollageInfo {
            nop(this.collageMapChangeTrigger)
            if (!(collageId in this.collageMap)) {
                this.collageMap[collageId] = {
                    lastUpdated: 0,
                    isLoading: false,
                    failed: false,
                    collageFile: null,
                    realCollage: null
                }
                this.collageMapChangeTrigger++
            }
            const collageInfo = this.collageMap[collageId]
            if (!collageInfo.isLoading && collageInfo.lastUpdated < Date.now() - CACHE_LIFE) {
                this.loadCollage(collageId)
            }
            if (collageInfo.failed) {
                throw new Error("Unable to get collage " + collageId)
            }
            return collageInfo
        }

        getCollage(collageId: string): file.Collage | null {
            return this.getCollageInfo(collageId).collageFile
        }

        getRealCollage(collageId: string): splitTime.Collage | null {
            return this.getCollageInfo(collageId).realCollage
        }

        async loadCollage(collageId: string): Promise<void> {
            const collageInfo = this.collageMap[collageId]
            try {
                collageInfo.failed = false
                const c = await this.server.api.collageJson.fetch(this.server.withProject({ collageId }))
                collageInfo.collageFile = c
                collageInfo.realCollage = splitTime.collage.makeCollageFromFile(c, true)
            } catch (e: unknown) {
                log.warn("Failed to load collage \"" + collageInfo + "\"", e)
                collageInfo.failed = true
            } finally {
                collageInfo.lastUpdated = Date.now()
                collageInfo.isLoading = false
                this.collageMapChangeTrigger++
            }
        }

        getSimpleGraphDrawable(collageId: string, montageId: string, direction?: string): body.GraphDrawable | null {
            const realCollage = this.getRealCollage(collageId)
            if (realCollage === null) {
                return null
            }
            const area = realCollage.getMontage(montageId, direction).getOverallArea()
            return {
                getCanvasRequirements(): body.CanvasRequirements {
                    return new body.CanvasRequirements(area)
                }
            }
        }
    }

    const CACHE_LIFE = 30 * 1000

    interface CollageInfo {
        lastUpdated: number
        isLoading: boolean
        failed: boolean
        collageFile: file.Collage | null
        realCollage: splitTime.Collage | null
    }
}