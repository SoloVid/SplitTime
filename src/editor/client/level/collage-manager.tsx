import { Collage as FileCollage } from "engine/file/collage"
import { Collage, makeCollageFromFile } from "engine/graphics/collage"
import { Immutable } from "engine/utils/immutable"
import { GraphDrawable } from "engine/world/body/body-rendering-graph"
import { CanvasRequirements } from "engine/world/body/render/drawable"
import { createContext } from "preact"
import { useMemo, useState } from "preact/hooks"
import { Cache, UnderlyingCacheObject } from "../cache"
import { ImmutableSetter } from "../preact-help"
import { ServerLiaison } from "../server-liaison"

export function useCollageManager(server: ServerLiaison) {
  const [cacheObject, setCacheObject] = useState<Immutable<UnderlyingCacheObject<CollageInfo>>>({})
  const collageManager = useMemo(() => makeCollageManager(server, cacheObject, setCacheObject), [server, cacheObject])
  return collageManager
}

function makeCollageManager(
  server: ServerLiaison,
  cacheObject: Immutable<UnderlyingCacheObject<CollageInfo>>,
  setCacheObject: ImmutableSetter<UnderlyingCacheObject<CollageInfo>>,
) {
  const cache = new Cache(async (collageId, previous) => {
    const c = await server.api.collageJson.fetch(server.withProject({ collageId }))
    if (previous !== null && JSON.stringify(c) === JSON.stringify(previous)) {
      return previous
    }
    return {
      collageFile: c,
      realCollage: makeCollageFromFile(c, true)
    } as const
  }, cacheObject, setCacheObject)
  cache.cacheLifeRandomFactor = 5

  return {
    getCollage(collageId: string): Immutable<FileCollage> | null {
      const info = cache.get(collageId)
      return info ? info.collageFile : null
    },

    getRealCollage(collageId: string): Immutable<Collage> | null {
      const info = cache.get(collageId)
      return info ? info.realCollage : null
    },

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
    },
  }
}

export type CollageManager = ReturnType<typeof makeCollageManager>

interface CollageInfo {
  collageFile: FileCollage
  realCollage: Collage
}

export const CollageManagerContext = createContext<CollageManager>({
  getCollage: () => null,
  getRealCollage: () => null,
  getSimpleGraphDrawable: () => null,
})

export function CollageManagerContextProvider({ server, children }: { server: ServerLiaison, children: any }) {
  const collageManager = useCollageManager(server)

  return (
    <CollageManagerContext.Provider value={collageManager}>
      {children}
    </CollageManagerContext.Provider>
  )
}
