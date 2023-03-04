import { join, posix, relative, sep } from "node:path"
import type { Config } from "./config"
import { prefixPlay } from "./constants"

export class PathHelper {
    constructor(private readonly config: Config) {}

    toProjectPath(projectId: string, filePath: string): string {
        const relPath = relative(this.getProjectDirectory(projectId), filePath)
        return "/" + ensurePosixPath(relPath)
    }

    toProjectWebPath(filePath: string): string {
        const relPath = relative(this.config.projectDirectory, filePath)
        return "/" + prefixPlay + "/" + ensurePosixPath(relPath)
    }

    getProjectDirectory(projectId: string): string {
        // if (this.config.isSingleProject) {
        //     return this.config.sourceDirectory
        // }
        return join(this.config.projectDirectory, projectId)
    }

    getFilePath(projectId: string, directory: string, file?: string): string {
        const tail = file ? join(directory, file) : directory
        return join(this.getProjectDirectory(projectId), tail)
    }
}

export function ensurePosixPath(filePath: string): string {
    return filePath.split(sep).join(posix.sep)
}
