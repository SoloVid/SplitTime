import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { FileEntry, ProjectFileTsApi } from "./api/project-file-ts-api"
import { Config } from "./config"
import { PathHelper } from "./path-helper"

export class ProjectFileTsApiBacking {
    private readonly pathHelper: PathHelper

    constructor(
        private readonly api: ProjectFileTsApi,
        private readonly config: Config
    ) {
        this.pathHelper = new PathHelper(config)
        this.api.directoryListing.serve(async request => {
            const requestDir = this.pathHelper.getFilePath(request.projectId, request.data.directory)
            const files = await readdir(requestDir)
            const responseFileEntries: FileEntry[] = []
            for (const file of files) {
                const filePath = join(requestDir, file)
                const stats = await stat(filePath)
                responseFileEntries.push({
                    type: stats.isDirectory() ? "directory" : "file",
                    name: file,
                    parentPath: this.pathHelper.toProjectPath(request.projectId, requestDir),
                    timeModified: stats.mtimeMs,
                    size: stats.size
                })
            }
            return responseFileEntries
        })
        this.api.readFile.serve(async request => {
            const path = this.pathHelper.getFilePath(request.projectId, request.data.filePath)
            const result = await readFile(path)
            return {
                base64Contents: result.toString("base64")
            }
        })
        this.api.writeFile.serve(async request => {
            const path = this.pathHelper.getFilePath(request.projectId, request.data.filePath)
            const contents = Buffer.from(request.data.base64Contents, "base64")
            await writeFile(path, contents)
            return null
        })
        this.api.deleteFile.serve(async request => {
            const path = this.pathHelper.getFilePath(request.projectId, request.data.filePath)
            await unlink(path)
            return null
        })
    }
}
