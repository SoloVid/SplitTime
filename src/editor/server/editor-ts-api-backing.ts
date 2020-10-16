namespace splitTime.editor.server {
    export class EditorTsApiBacking {
        public readonly api = new EditorTsApi()
        private readonly nodeLibs = new NodeLibs()

        constructor() {
            this.api.test1.serve(request => "Here's your string! " + request)
            this.api.test2.serve(request => {
                return {
                    one: request + 7,
                    two: "himom"
                }
            })
            this.api.levelJson.serve(async request => {
                const fileName = request.data.levelId + ".json"
                const path = this.getFilePath(request.projectId, "levels", fileName)
                const result = await this.nodeLibs.fsPromises.readFile(path)
                return JSON.parse(result.toString())
            })
            this.api.imageInfo.serve(async request => {
                const path = this.getFilePath(request.projectId, "images", request.data.imageId)
                const stats = await this.nodeLibs.fsPromises.stat(path)
                return {
                    webPath: this.toWebPath(path),
                    timeModifiedString: "" + stats.mtimeMs
                }
            })
        }

        private toWebPath(filePath: string): string {
            const relPath = this.nodeLibs.path.relative(__ROOT__, filePath)
            return "/" + relPath.split(this.nodeLibs.path.sep).join(this.nodeLibs.path.posix.sep)
        }

        private getFilePath(projectId: string, directory: string, file: string): string {
            return this.nodeLibs.path.join(__ROOT__, "projects", projectId, directory, file)
        }
    }
}