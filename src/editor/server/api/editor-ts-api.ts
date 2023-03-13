import type { Collage } from "engine/file/collage"
import type { FileData } from "engine/world/level/level-file-data"
import type { int } from "globals"
import { WithProject } from "../api-wrappings"
import { BuildStatus, KnownBuildStatus } from "../build-status"
import type { Response, Server } from "../server-lite"
import { TsApiEndpoint } from "../ts-api-endpoint"
import { TsApiHelper } from "../ts-api-helper"
import { GitTsApi } from "./git-ts-api"
import { ProjectFileTsApi } from "./project-file-ts-api"

export class EditorTsApi implements Server<unknown, unknown> {
    private static readonly url = "/editor/ts-api"

    projectFiles: ProjectFileTsApi
    git: GitTsApi
    test1: TsApiEndpoint<"yo", "Here: yo">
    test2: TsApiEndpoint<0, { one: 1, two: 2 }>
    levelJson: TsApiEndpoint<
        WithProject<{ levelId: string }>,
        FileData
    >
    collageJson: TsApiEndpoint<
        WithProject<{ collageId: string }>,
        Collage
    >
    imageInfo: TsApiEndpoint<
        WithProject<{ imageId: string }>,
        { webPath: string, timeModifiedString: string }
    >
    buildStatus: TsApiEndpoint<
        WithProject<KnownBuildStatus>,
        BuildStatus
    >

    private helper: TsApiHelper

    constructor() {
        const a = this.helper = new TsApiHelper(EditorTsApi.url)
        this.projectFiles = new ProjectFileTsApi(EditorTsApi.url)
        this.git = new GitTsApi(EditorTsApi.url)
        this.test1 = a.endpoint()
        this.test2 = a.endpoint()
        this.levelJson = a.endpoint()
        this.collageJson = a.endpoint()
        this.imageInfo = a.endpoint()
        this.buildStatus = a.endpoint()
    }

    async handle(url: string, body: unknown): Promise<Response<unknown>> {
        const myResponse = await this.helper.handle(url, body)
        if (myResponse !== null) {
            return myResponse
        }
        const projectFilesResponse = await this.projectFiles.handle(url, body)
        if (projectFilesResponse !== null) {
            return projectFilesResponse
        }
        const gitResponse = await this.git.handle(url, body)
        if (gitResponse !== null) {
            return gitResponse
        }
        return null
    }
}
