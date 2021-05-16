namespace splitTime.editor.server {
    export class EditorTsApiBacking {
        public readonly api = new EditorTsApi()
        private readonly projectFiles: ProjectFileTsApiBacking
        private readonly nodeLibs = new NodeLibs()
        private readonly pathHelper: PathHelper

        constructor(private readonly config: Config) {
            this.pathHelper = new PathHelper(config)
            this.projectFiles = new ProjectFileTsApiBacking(this.api.projectFiles, config)
            this.api.test1.serve(request => "Here's your string! " + request)
            this.api.test2.serve(request => {
                return {
                    one: request + 7,
                    two: "himom"
                }
            })
            this.api.levelJson.serve(async request => {
                const fileName = request.data.levelId + ".json"
                const path = this.pathHelper.getFilePath(request.projectId, LEVEL_DIR, fileName)
                const result = await this.nodeLibs.fsPromises.readFile(path)
                return JSON.parse(result.toString()) as splitTime.level.FileData
            })
            this.api.collageJson.serve(async request => {
                const fileName = request.data.collageId + ".json"
                const path = this.pathHelper.getFilePath(request.projectId, COLLAGE_DIR, fileName)
                const result = await this.nodeLibs.fsPromises.readFile(path)
                return JSON.parse(result.toString()) as splitTime.file.Collage
            })
            this.api.imageInfo.serve(async request => {
                const path = this.pathHelper.getFilePath(request.projectId, IMAGE_DIR, request.data.imageId)
                const stats = await this.nodeLibs.fsPromises.stat(path)
                return {
                    webPath: this.pathHelper.toProjectWebPath(path),
                    timeModifiedString: "" + stats.mtimeMs
                }
            })
        }
    }
}