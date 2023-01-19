import { fork } from "node:child_process"
import { join } from "node:path"
import { debounce } from "../common/debounce"
import { resolveDeclarationNonRelativePaths } from "../common/resolve-non-relative-paths"
import type { Builder } from "./builder"
import rootDir from "./root-dir"

const srcRoot = join(__dirname, "..", "..")
const projectRoot = join(srcRoot, "..")

export async function getTypeDeclarationBuilder(): Promise<Builder> {
  return {
    name: "type declaration generation",
    run: generateAndModifyDeclarationFiles,
    // run: debounce(generateAndModifyDeclarationFiles, 50),
    printErrors: true,
    watchList: [join(rootDir, "src")],
  }
}

async function generateAndModifyDeclarationFiles() {
  await generateDeclarationFiles()
  await resolveDeclarationNonRelativePaths(projectRoot)
}

async function generateDeclarationFiles(): Promise<void> {
  const tscBinaryPath = require.resolve("typescript/bin/tsc")
  const process = fork(tscBinaryPath, [
      "--emitDeclarationOnly",
  ], {
      cwd: join(srcRoot, ".."),
      stdio: "inherit"
  })
  return new Promise((resolve, reject) => {
      process.on("exit", code => {
          if(code === 0) {
              resolve()
          } else {
              reject("tsc failed")
          }
      })
  })
}
