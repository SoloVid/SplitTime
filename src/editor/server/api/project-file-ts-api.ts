namespace splitTime.editor.server {
    export interface FileEntry {
        type: "directory" | "file"
        name: string
        parentPath: string
        timeModified: number
        size: number
    }

    export class ProjectFileTsApi implements serverLite.Server {
        private static readonly urlTail = "/project-file"
        private readonly url: string

        directoryListing: TsApiEndpoint<
            WithProject<{ directory: string }>,
            FileEntry[]
        >
        readFile: TsApiEndpoint<
            WithProject<{ filePath: string }>,
            { base64Contents: string }
        >
        writeFile: TsApiEndpoint<
            WithProject<{ filePath: string, base64Contents: string }>,
            null
        >
        deleteFile: TsApiEndpoint<
            WithProject<{ filePath: string }>,
            null
        >

        private helper: TsApiHelper

        constructor(baseUrl: string) {
            this.url = baseUrl + ProjectFileTsApi.urlTail
            const a = this.helper = new TsApiHelper(this.url)
            this.directoryListing = a.endpoint()
            this.readFile = a.endpoint()
            this.writeFile = a.endpoint()
            this.deleteFile = a.endpoint()
        }

        handle(url: string, body: unknown): PromiseLike<serverLite.Response> {
            return this.helper.handle(url, body)
        }
    }
}