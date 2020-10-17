namespace splitTime.editor.server {
    export interface FileEntry {
        fileType: "directory" | "file"
        name: string
        parentPath: string
        timeModified: number
        size: Date
    }

    export class ProjectFileTsApi implements serverLite.Server {
        private static readonly urlTail = "/project-file"
        private readonly url: string

        directoryListing: TsApiEndpoint<
            WithProject<{ directory: string }>,
            FileEntry[]
        >

        private helper: TsApiHelper

        constructor(baseUrl: string) {
            this.url = baseUrl + ProjectFileTsApi.urlTail
            const a = this.helper = new TsApiHelper(this.url)
            this.directoryListing = a.endpoint()
        }

        handle(url: string, body: unknown): PromiseLike<serverLite.Response> {
            return this.helper.handle(url, body)
        }
    }
}