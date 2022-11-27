import { Collage as FileCollage } from "engine/file/collage"
import { Collage, makeCollageFromFile } from "engine/graphics/collage"
import { CanvasRequirements } from "engine/world/body/render/drawable"
import { ServerLiaison } from "../server-liaison"
import { Cache, UnderlyingCacheObject } from "../cache"
import { Immutable } from "engine/utils/immutable"
import { GraphDrawable } from "engine/world/body/body-rendering-graph"
import { ImmutableSetter } from "../preact-help"
import { useState } from "preact/hooks"

export function useCollageManager(server: ServerLiaison) {
  const [cacheObject, setCacheObject] = useState<UnderlyingCacheObject<CollageInfo>>({})
  const collageManager = new CollageManager(server, cacheObject, setCacheObject)
  return collageManager
}

export class CollageManager {
  private readonly cache: Cache<CollageInfo>

  constructor(
    private readonly server: ServerLiaison,
    cacheObject: Immutable<UnderlyingCacheObject<CollageInfo>>,
    setCacheObject: ImmutableSetter<UnderlyingCacheObject<CollageInfo>>,
  ) {
    this.cache = new Cache(async collageId => {
      const c = await this.server.api.collageJson.fetch(this.server.withProject({ collageId }))
      return {
        collageFile: c,
        realCollage: makeCollageFromFile(c, true)
      }
    }, cacheObject, setCacheObject)
    this.cache.cacheLifeRandomFactor = 5
  }

  getCollage(collageId: string): Immutable<FileCollage> | null {
    const info = this.cache.get(collageId)
    return info ? info.collageFile : null
  }

  getRealCollage(collageId: string): Immutable<Collage> | null {
    const info = this.cache.get(collageId)
    return info ? info.realCollage : null
  }

  getSimpleGraphDrawable(collageId: string, montageId: string, direction?: string): GraphDrawable | null {
    const realCollage = this.getRealCollage(collageId)
    if (realCollage === null) {
      return null
    }
    const area = realCollage.getMontage(montageId, direction).getOverallArea()
    return {
      getCanvasRequirements(): CanvasRequirements {
        return new CanvasRequirements(area)
      }
    }
  }
}

interface CollageInfo {
  collageFile: FileCollage
  realCollage: Collage
}
