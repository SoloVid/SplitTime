import * as path from "path"
import * as fsOrig from "fs"
const fs = fsOrig.promises

export function join(...args: string[]): string {
    return slash(path.join.apply(path, args))
}

export function slash(filePath: string): string {
    return filePath.replace(/\\/g, "/")
}

export function getEngineRoot(): string {
    return path.resolve(require("find-root")(__dirname))
}

export async function writeFile(filePath: string, fileContents?: string | Buffer): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, fileContents)
}
