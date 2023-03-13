import { WithProject } from "../api-wrappings"
import type { Response, Server } from "../server-lite"
import { TsApiEndpoint } from "../ts-api-endpoint"
import { TsApiHelper } from "../ts-api-helper"

export class GitTsApi implements Server {
    private static readonly urlTail = "/git"
    private readonly url: string

    diff: TsApiEndpoint<
        WithProject<{}>,
        string
    >
    head: TsApiEndpoint<
        WithProject<{}>,
        { branchName: string, commitSha: string }
    >
    restoreSnapshot: TsApiEndpoint<
        WithProject<{ commitOrRef: string }>,
        null
    >
    takeSnapshot: TsApiEndpoint<
        WithProject<{ message: string }>,
        null
    >

    private helper: TsApiHelper

    constructor(baseUrl: string) {
        this.url = baseUrl + GitTsApi.urlTail
        const a = this.helper = new TsApiHelper(this.url)
        this.diff = a.endpoint()
        this.head = a.endpoint()
        this.restoreSnapshot = a.endpoint()
        this.takeSnapshot = a.endpoint()
    }

    handle(url: string, body: unknown): PromiseLike<Response> {
        return this.helper.handle(url, body)
    }
}
