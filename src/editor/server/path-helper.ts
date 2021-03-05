namespace splitTime.editor.server {
    export class PathHelper {
        private readonly nodeLibs = new NodeLibs()

        toProjectPath(projectId: string, filePath: string): string {
            const relPath = this.nodeLibs.path.relative(this.getProjectDirectory(projectId), filePath)
            return "/" + this.ensurePosixPath(relPath)
        }

        toWebPath(filePath: string): string {
            const relPath = this.nodeLibs.path.relative(this.getEngineDirectory(), filePath)
            return "/" + this.ensurePosixPath(relPath)
        }

        ensurePosixPath(filePath: string): string {
            return filePath.split(this.nodeLibs.path.sep).join(this.nodeLibs.path.posix.sep)
        }

        getEngineDirectory(): string {
            return path.resolve(require("find-root")(__dirname))
        }
        
        getProjectDirectory(projectId: string): string {
            return this.nodeLibs.path.join(this.getEngineDirectory(), "projects", projectId)
        }

        getFilePath(projectId: string, directory: string, file?: string): string {
            const tail = file ? this.nodeLibs.path.join(directory, file) : directory
            return this.nodeLibs.path.join(this.getProjectDirectory(projectId), tail)
        }
    }
}