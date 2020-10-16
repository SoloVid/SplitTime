namespace splitTime.editor.level {
    export class ServerLiaison {
        api = new server.EditorTsApi()

        constructor(
            public projectId: string
        ) {

        }

        withProject<T>(data: T): server.WithProject<T> {
            return {
                projectId: this.projectId,
                data
            }
        }

        async imgSrc(fileName: string): Promise<string> {
            if (!fileName) {
                return ""
            }
            const info = await this.api.imageInfo.fetch(this.withProject({ imageId: fileName }))
            return info.webPath + "?" + info.timeModifiedString
        }
    }
}