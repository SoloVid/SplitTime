import { Collage as FileCollage } from "engine/file/collage"
import { Collage, makeCollageFromFile } from "engine/graphics/collage"
import { Immutable } from "engine/utils/immutable"
import { GraphDrawable } from "engine/world/body/body-rendering-graph"
import { CanvasRequirements } from "engine/world/body/render/drawable"
import { useMemo, useState } from "preact/hooks"
import { Cache, UnderlyingCacheObject } from "../cache"
import { ImmutableSetter } from "../preact-help"
import { ServerLiaison } from "../server-liaison"

export function useCollageManager(server: ServerLiaison) {
  const [cacheObject, setCacheObject] = useState<Immutable<UnderlyingCacheObject<CollageInfo>>>({})
  const collageManager = useMemo(() => new CollageManager(server, cacheObject, setCacheObject), [server, cacheObject])
  return collageManager
}

export class CollageManager {
  private readonly cache: Cache<CollageInfo>

  constructor(
    private readonly server: ServerLiaison,
    cacheObject: Immutable<UnderlyingCacheObject<CollageInfo>>,
    setCacheObject: ImmutableSetter<UnderlyingCacheObject<CollageInfo>>,
  ) {
    this.cache = new Cache(async (collageId, previous) => {
      const c = await this.server.api.collageJson.fetch(this.server.withProject({ collageId }))
      if (previous !== null && JSON.stringify(c) === JSON.stringify(previous)) {
        return previous
      }
      return {
        collageFile: c,
        realCollage: makeCollageFromFile(c, true)
      } as const
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
