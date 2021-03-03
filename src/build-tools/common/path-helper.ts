import * as path from "path"

export function join(...args: string[]): string {
    return slash(path.join.apply(path, args))
}

export function slash(filePath: string): string {
    return filePath.replace(/\\/g, "/")
}

export function getEngineRoot(): string {
    return path.resolve(require("find-root")(__dirname))
}
