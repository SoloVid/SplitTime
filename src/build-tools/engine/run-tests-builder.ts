import { fork } from "node:child_process"
import { join } from "node:path"
import type { Builder } from "./builder"
import rootDir from "./root-dir"

export async function getRunTestsBuilder(): Promise<Builder> {
  return {
    name: "unit tests",
    run: runTests,
    printErrors: false,
    watchList: [join(rootDir, "src")],
  }
}

async function runTests() {
  const utsBinaryPath = require.resolve("under-the-sun/lib/cli.js")
  const process = fork(utsBinaryPath, [
    "-r", "esbuild-register", "src/engine-test",
  ], {
      cwd: rootDir,
      stdio: "inherit"
  })
  return new Promise<void>((resolve, reject) => {
      process.on("exit", code => {
          if(code === 0) {
              resolve()
          } else {
              reject(new Error("tsc failed"))
          }
      })
  })

}
