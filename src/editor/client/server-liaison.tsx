import { WithProject } from "editor/server/api-wrappings"
import { EditorTsApi } from "editor/server/api/editor-ts-api"
import { createContext } from "preact"
import { useMemo, useState } from "preact/hooks"
import { Cache, UnderlyingCacheObject } from "./cache"
import { getPlaceholderImage } from "./editor-functions"

type ImageContext = {
    imgSrc: (fileName: string) => string
}

export const imageContext = createContext<ImageContext>({
    imgSrc: () => getPlaceholderImage()
})

export function useProjectImages(server: ServerLiaison) {
    const [cacheObject, setCacheObject] = useState<UnderlyingCacheObject<string>>({})
    const imageSrcCache = useMemo(() => {
        const cache = new Cache(
            async (fileName, previous) => {
                try {
                    const info = await server.api.imageInfo.fetch(server.withProject({ imageId: fileName }))
                    const newValue = info.webPath + "?" + info.timeModifiedString
                    if (newValue === previous) {
                        return previous
                    }
                    return newValue
                } catch (e: unknown) {
                    return getPlaceholderImage()
                }
            },
            cacheObject,
            setCacheObject,
        )
        cache.cacheLifeRandomFactor = 5
        return cache
    }, [server, cacheObject])
    return {
        imgSrc(fileName: string): string {
            if (!fileName) {
                return ""
            }
            const srcOrNull = imageSrcCache.get(fileName)
            return srcOrNull || ""
        }
    }
}

type ProjectImagesProviderProps = {
    server: ServerLiaison
    children: any
}

export function ProjectImagesProvider({ server, children }: ProjectImagesProviderProps) {
    const images = useProjectImages(server)
    return <imageContext.Provider value={images}>
        {children}
    </imageContext.Provider>
}

export class ServerLiaison {
    api = new EditorTsApi()

    constructor(
        public projectId: string,
    ) {
    }

    withProject<T>(data: T): WithProject<T> {
        return {
            projectId: this.projectId,
            data
        }
    }
}
