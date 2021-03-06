namespace splitTime.editor.server {
    export class ProjectFileTsApiBacking {
        private readonly nodeLibs = new NodeLibs()
        private readonly pathHelper: PathHelper

        constructor(
            private readonly api: ProjectFileTsApi,
            private readonly config: Config
        ) {
            this.pathHelper = new PathHelper(config)
            this.api.directoryListing.serve(async request => {
                const requestDir = this.pathHelper.getFilePath(request.projectId, request.data.directory)
                const files = await this.nodeLibs.fsPromises.readdir(requestDir)
                const responseFileEntries: FileEntry[] = []
                for (const file of files) {
                    const filePath = this.nodeLibs.path.join(requestDir, file)
                    const stats = await this.nodeLibs.fsPromises.stat(filePath)
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
                const result = await this.nodeLibs.fsPromises.readFile(path)
                return {
                    base64Contents: result.toString("base64")
                }
            })
            this.api.writeFile.serve(async request => {
                const path = this.pathHelper.getFilePath(request.projectId, request.data.filePath)
                const contents = Buffer.from(request.data.base64Contents, "base64")
                await this.nodeLibs.fsPromises.writeFile(path, contents)
                return null
            })
            this.api.deleteFile.serve(async request => {
                const path = this.pathHelper.getFilePath(request.projectId, request.data.filePath)
                await this.nodeLibs.fsPromises.unlink(path)
                return null
            })
        }
    }
}