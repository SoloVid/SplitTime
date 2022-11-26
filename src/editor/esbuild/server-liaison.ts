import { EditorTsApi } from "editor/server/api/editor-ts-api"
import { WithProject } from "editor/server/api-wrappings"
import { Cache } from "./cache"

export class ServerLiaison {
    api = new EditorTsApi()

    private readonly imageSrcCache: Cache<string>

    constructor(
        public projectId: string
    ) {
        this.imageSrcCache = new Cache(async fileName => {
            try {
                const info = await this.api.imageInfo.fetch(this.withProject({ imageId: fileName }))
                return info.webPath + "?" + info.timeModifiedString
            } catch (e: unknown) {
                //TODO: Get placeholder
                return "TODO:placeholder"
                // return level.getPlaceholderImage()
            }
        })
        this.imageSrcCache.cacheLifeRandomFactor = 5
    }

    withProject<T>(data: T): WithProject<T> {
        return {
            projectId: this.projectId,
            data
        }
    }

    imgSrc(fileName: string): string {
        if (!fileName) {
            return ""
        }
        const srcOrNull = this.imageSrcCache.get(fileName)
        return srcOrNull || ""
    }
}
