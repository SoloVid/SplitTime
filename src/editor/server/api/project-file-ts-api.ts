import { WithProject } from "../api-wrappings"
import type { Response, Server } from "../server-lite"
import { TsApiEndpoint } from "../ts-api-endpoint"
import { TsApiHelper } from "../ts-api-helper"

export interface FileEntry {
    type: "directory" | "file"
    name: string
    parentPath: string
    timeModified: number
    size: number
}

export class ProjectFileTsApi implements Server {
    private static readonly urlTail = "/project-file"
    private readonly url: string

    directoryListing: TsApiEndpoint<
        WithProject<{ directory: string }>,
        FileEntry[]
    >
    readFile: TsApiEndpoint<
        WithProject<{ filePath: string }>,
        { base64Contents: string, isBinaryFile: false } | { base64Contents: string | null, isBinaryFile: true }
    >
    writeFile: TsApiEndpoint<
        WithProject<{ filePath: string, base64Contents: string, allowOverwrite: boolean }>,
        null
    >
    moveFile: TsApiEndpoint<
        WithProject<{ oldFilePath: string, newFilePath: string, allowOverwrite: boolean }>,
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
        this.moveFile = a.endpoint()
        this.deleteFile = a.endpoint()
    }

    handle(url: string, body: unknown): PromiseLike<Response> {
        return this.helper.handle(url, body)
    }
}
