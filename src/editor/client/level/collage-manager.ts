namespace splitTime.editor.level {
    export class CollageManager {
        private readonly cache: client.Cache<CollageInfo>

        constructor(
            private readonly server: client.ServerLiaison
        ) {
            this.cache = new client.Cache(async collageId => {
                const c = await this.server.api.collageJson.fetch(this.server.withProject({ collageId }))
                return {
                    collageFile: c,
                    realCollage: splitTime.collage.makeCollageFromFile(c, true)
                }
            })
            this.cache.cacheLifeRandomFactor = 5
        }

        getCollage(collageId: string): file.Collage | null {
            const info = this.cache.get(collageId)
            return info ? info.collageFile : null
        }

        getRealCollage(collageId: string): splitTime.Collage | null {
            const info = this.cache.get(collageId)
            return info ? info.realCollage : null
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

    interface CollageInfo {
        collageFile: file.Collage
        realCollage: splitTime.Collage
    }
}