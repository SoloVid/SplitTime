import { fork } from "node:child_process"
import { join } from "../common/file-helper"
import { tsconfigLocation } from "./tsconfig"

export async function compileTypescript(projectPath: string): Promise<void> {
    const tscBinaryPath = require.resolve("typescript/bin/tsc")
    const process = fork(tscBinaryPath, [
        "--project", join(projectPath, tsconfigLocation),
        "--noEmit",
    ], {
        cwd: projectPath,
        stdio: "inherit",
    })
    return new Promise((resolve, reject) => {
        process.on("exit", code => {
            if(code === 0) {
                resolve()
            } else {
                reject("Type check failed")
            }
        })
    })
}
