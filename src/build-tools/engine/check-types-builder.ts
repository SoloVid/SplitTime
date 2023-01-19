import { fork } from "node:child_process"
import { join } from "node:path"
import type { Builder } from "./builder"
import rootDir from "./root-dir"

const srcRoot = join(__dirname, "..", "..")

export async function getCheckTypesBuilder(): Promise<Builder> {
  return {
    name: "check types",
    run: runTsc,
    printErrors: false,
    watchList: [join(rootDir, "src")],
  }
}

async function runTsc(): Promise<void> {
  const tscBinaryPath = require.resolve("typescript/bin/tsc")
  const process = fork(tscBinaryPath, [
      "--noEmit",
  ], {
      cwd: rootDir,
      stdio: "inherit"
  })
  return new Promise((resolve, reject) => {
      process.on("exit", code => {
          if(code === 0) {
              resolve()
          } else {
              reject(new Error("tsc failed"))
          }
      })
  })
}
