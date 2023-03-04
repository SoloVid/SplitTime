import { streamToBuffer } from "build-tools/common/stream-helper"
import assert from "node:assert"
import { fork } from "node:child_process"
import { join } from "../common/file-helper"
import { tsconfigLocation } from "./tsconfig"

export async function compileTypescript(projectPath: string): Promise<void> {
    const tscBinaryPath = require.resolve("typescript/bin/tsc")
    const child = fork(tscBinaryPath, [
        "--project", join(projectPath, tsconfigLocation),
        "--noEmit",
        "--pretty",
    ], {
        cwd: projectPath,
        stdio: "pipe",
    })
    assert(child.stdout, "stdout should be defined on child process")
    assert(child.stderr, "stderr should be defined on child process")
    const [code, stdout, stderr] = await Promise.all([
        new Promise((resolve) => {
            child.on("exit", resolve)
        }),
        streamToBuffer(child.stdout),
        streamToBuffer(child.stderr),
    ])
    if(code !== 0) {
        throw new Error(stdout.toString())
    }
}
