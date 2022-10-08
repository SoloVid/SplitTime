import * as child_process from "child_process"
import * as path from "path"
import * as fsOrig from "fs"
const fs = fsOrig.promises

export function join(...args: string[]): string {
    return slash(path.join.apply(path, args))
}

export function relative(from: string, to: string): string {
    return slash(path.relative(from, to))
}

export function slash(filePath: string): string {
    return filePath.replace(/\\/g, "/")
}

// export function getEngineRoot(): string {
//     return path.resolve(require("find-root")(__dirname))
// }

export async function getEngineModuleRoot(projectRoot: string): Promise<string> {
    // We're using this hackaround method instead of something involving __dirname
    // because __filename and __dirname have symlinks resolved.
    // Resolved symlinks are problematic for local development of engine
    // alongside project.
    const packagePath = await new Promise<string>((resolve, reject) => {
        const child = child_process.spawn("node", [
            "--preserve-symlinks",
            "--eval", "process.stdout.write(require.resolve('splittime/package.json'))"
        ], {
            cwd: projectRoot
        })
        let output = ""
        child.stdout.on("data", data => {
            output += data
        })
        child.on("close", code => {
            if (code === 0) {
                resolve(output)
            } else {
                reject("Resolve module failed")
            }
        })
    })
    return slash(path.dirname(packagePath))
}

export async function writeFile(filePath: string, fileContents?: string | Buffer): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, fileContents)
}
