import { debounce } from "build-tools/common/debounce"
import chokidar from "chokidar"
import { buildProject } from "./build-project"
import { buildDirectory, buildLogsDirectory, generatedDirectory } from "./constants"

void run()

async function run() {
  try {
    await runUnsafe()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

async function runUnsafe() {
  let watch = false
  let checkTypes = false
  let runTests = false

  const args = process.argv.slice(2)
  while (args.length > 0) {
    const option = args.shift()
    switch (option) {
      case "--all":
        checkTypes = true
        runTests = true
        break
      case "--check":
        checkTypes = true
        break
      case "--test":
        runTests = true
        break
      case "--watch":
        watch = true
        break
    }
  }

  // const build = () => buildProject(".")
  // This debounce timeout is set pretty high because there's a high likelihood
  // of multiple files changing at once when the engine is rebuilt.
  const build = debounce(() => buildProject({
    projectPath: ".",
    checkTypes,
  }), 500)
  // This timeout gives the parent process a moment to shut us down before double printing.
  const changeDetectedBuild = (path: string) => setTimeout(() => {
    console.info(`Change detected: ${path}`)
    build()
  }, 10)

  if (watch) {
    chokidar.watch(".", {
      ignoreInitial: true,
      ignored: [
        ".*/**",
        "node_modules/**",
        `${buildDirectory}/**`,
        // `${generatedDirectory}/**`,
        // `${buildLogsDirectory}/**`,
        "dist/**",
      ],
      // Renames don't work on Windows while chokidar is watching.
      // https://github.com/paulmillr/chokidar/issues/1031
      usePolling: process.platform === "win32",
    }).on("all", (event, path) => changeDetectedBuild(path))
    chokidar.watch("node_modules/splittime/lib", {
      ignoreInitial: true,
    }).on("all", (event, path) => changeDetectedBuild(path))
  }
  await build()
}
