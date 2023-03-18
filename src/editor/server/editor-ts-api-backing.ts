import { Collage } from "engine/file/collage"
import { FileData } from "engine/world/level/level-file-data"
import { readFile, stat } from "node:fs/promises"
import { EditorTsApi } from "./api/editor-ts-api"
import { getBuildStatus } from "./build-status"
import { Config } from "./config"
import { GitTsApiBacking } from "./git-ts-api-backing"
import { PathHelper } from "./path-helper"
import { ProjectFileTsApiBacking } from "./project-file-ts-api-backing"
import YAML from "yaml"

export class EditorTsApiBacking {
    public readonly api = new EditorTsApi()
    private readonly projectFiles: ProjectFileTsApiBacking
    private readonly git: GitTsApiBacking
    private readonly pathHelper: PathHelper

    constructor(private readonly config: Config) {
        this.pathHelper = new PathHelper(config)
        this.projectFiles = new ProjectFileTsApiBacking(this.api.projectFiles, config)
        this.git = new GitTsApiBacking(this.api.git, config)
        this.api.test1.serve(request => `Here: ${request}`)
        this.api.test2.serve(request => {
            return {
                one: (request + 1) as 1,
                two: (request + 2) as 2,
            }
        })
        this.api.levelJson.serve(async request => {
            const fileName = request.data.levelId + ".lvl.yml"
            const path = this.pathHelper.getFilePath(request.projectId, fileName)
            const result = await readFile(path)
            return YAML.parse(result.toString()) as FileData
        })
        this.api.collageJson.serve(async request => {
            const fileName = request.data.collageId + ".clg.yml"
            const path = this.pathHelper.getFilePath(request.projectId, fileName)
            const result = await readFile(path)
            return YAML.parse(result.toString()) as Collage
        })
        this.api.imageInfo.serve(async request => {
            const path = this.pathHelper.getFilePath(request.projectId, request.data.imageId)
            const stats = await stat(path)
            return {
                webPath: this.pathHelper.toProjectWebPath(path),
                timeModifiedString: "" + stats.mtimeMs
            }
        })
        this.api.buildStatus.serve(async request => {
            return await getBuildStatus(request.projectId, request.data, { pathHelper: this.pathHelper })
        })
    }
}
