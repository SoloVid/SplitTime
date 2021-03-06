namespace splitTime.editor.server {
    export class PathHelper {
        private readonly nodeLibs = new NodeLibs()

        constructor(private readonly config: Config) {}

        toProjectPath(projectId: string, filePath: string): string {
            const relPath = this.nodeLibs.path.relative(this.getProjectDirectory(projectId), filePath)
            return "/" + this.ensurePosixPath(relPath)
        }

        toProjectWebPath(filePath: string): string {
            const relPath = this.nodeLibs.path.relative(this.config.sourceDirectory, filePath)
            return "/" + prefixRun + "/" + this.ensurePosixPath(relPath)
        }

        ensurePosixPath(filePath: string): string {
            return filePath.split(this.nodeLibs.path.sep).join(this.nodeLibs.path.posix.sep)
        }

        getProjectDirectory(projectId: string): string {
            // if (this.config.isSingleProject) {
            //     return this.config.sourceDirectory
            // }
            return this.nodeLibs.path.join(this.config.sourceDirectory, projectId)
        }

        getFilePath(projectId: string, directory: string, file?: string): string {
            const tail = file ? this.nodeLibs.path.join(directory, file) : directory
            return this.nodeLibs.path.join(this.getProjectDirectory(projectId), tail)
        }
    }
}