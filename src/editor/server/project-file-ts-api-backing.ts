import { isBinaryFile } from "isbinaryfile"
import { access, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
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
            const isBinary = await isBinaryFile(path)
            if (isBinary) {
                const s = await stat(path)
                if (s.size > 1 * 1024 * 1024) {
                    return {
                        isBinaryFile: true,
                        base64Contents: null,
                    }
                }
            }

            const contents = await readFile(path)
            return {
                isBinaryFile: isBinary,
                base64Contents: contents.toString("base64"),
            }
        })
        this.api.writeFile.serve(async request => {
            const path = this.pathHelper.getFilePath(request.projectId, request.data.filePath)
            const contents = Buffer.from(request.data.base64Contents, "base64")
            if (!request.data.allowOverwrite) {
                if (await fileExists(path)) {
                    throw new Error(`Write blocked because file already exists: ${path}`)
                }
            }
            await writeFile(path, contents)
            return null
        })
        this.api.moveFile.serve(async request => {
            const oldPath = this.pathHelper.getFilePath(request.projectId, request.data.oldFilePath)
            const newPath = this.pathHelper.getFilePath(request.projectId, request.data.newFilePath)
            if (!request.data.allowOverwrite) {
                if (await fileExists(newPath)) {
                    throw new Error(`Rename blocked because file already exists: ${newPath}`)
                }
            }
            await rename(oldPath, newPath)
            return null
        })
        this.api.deleteFile.serve(async request => {
            const path = this.pathHelper.getFilePath(request.projectId, request.data.filePath)
            await rm(path, { recursive: true, force: true })
            return null
        })
    }
}

export async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path)
        return true
    } catch (e) {
        return false
    }
}
