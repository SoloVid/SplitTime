import chokidar from "chokidar"
import { fork } from "node:child_process"
import { basename, join } from "node:path"
import { makeCrowdControl } from "../common/one-at-a-time"
import { resolveDeclarationNonRelativePaths } from "../common/resolve-non-relative-paths"

const srcRoot = join(__dirname, "..", "..")
const projectRoot = join(srcRoot, "..")

const crowdControl = makeCrowdControl()

function doIt() {
  crowdControl.oneAtATime(async () => {
    console.log("Regenerating engine type declarations...")
    await generateDeclarationFiles()
    await resolveDeclarationNonRelativePaths(projectRoot)
    console.log("Type declarations generated!")
  }).catch((e) => {
    console.error(e)
  })
}

doIt()

chokidar.watch(srcRoot, {
  ignoreInitial: true
}).on("all", (event, path) => {
  console.log("Event:", event, basename(path))
  doIt()
})

export async function generateDeclarationFiles(): Promise<void> {
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
