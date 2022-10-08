import * as childProcess from "node:child_process"
import { join } from "../common/file-helper"
import { tsconfigLocation, writeTsconfig } from "./tsconfig"

export async function compileTypescript(projectPath: string): Promise<void> {
    // await writeTsconfig(projectPath)
    const tscBinaryPath = require.resolve("typescript/bin/tsc")
    const process = childProcess.fork(tscBinaryPath, [
        "--project", join(projectPath, tsconfigLocation),
        "--noEmit",
    ], {
        cwd: projectPath
    })
    return new Promise((resolve, reject) => {
        process.on("exit", code => {
            if(code === 0) {
                resolve()
            } else {
                reject("Project TypeScript compilation failed")
            }
        })
    })
}
