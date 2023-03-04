import chokidar from "chokidar"
import { makeBuildAll } from "./build-all"
import { getBuildToolsBuilder } from "./build-tools-builder"
import type { Builder } from "./builder"
import { getCheckTypesBuilder } from "./check-types-builder"
import { getEditorClientBuilder } from "./editor-client-builder"
import { getEditorPlayerBuilder } from "./editor-player-builder"
import { getEditorServerBuilder } from "./editor-server-builder"
import { getEngineBuilder } from "./engine-builder"
import { getRunTestsBuilder } from "./run-tests-builder"
import { getTypeDeclarationBuilder } from "./type-declaration-builder"

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
  let buildBuildTools = false
  let buildEditorClient = false
  let buildEditorServer = false
  let buildEngine = false
  let checkTypes = false
  let generateTypeDeclarations = false
  let runTests = false

  function enableAll() {
    buildBuildTools = true
    buildEditorClient = true
    buildEditorServer = true
    buildEngine = true
    checkTypes = true
    generateTypeDeclarations = true
    runTests = true
  }

  const args = process.argv.slice(2)
  while (args.length > 0) {
    const option = args.shift()
    switch (option) {
      case "--all":
        enableAll()
        break
      case "--build-tools":
        buildBuildTools = true
        break
      case "--check":
        checkTypes = true
        break
      case "--editor-client":
        buildEditorClient = true
        break
      case "--editor-server":
        buildEditorServer = true
        break
      case "--engine":
        buildEngine = true
        break
      case "--help":
      case "-h":
        console.info(`
Usage: node ${process.argv[1]} [options]

Build stuff in the project.
By default, only fast and necessary builds are completed.

Options:
  --all                        build everything
  --build-tools                build tools used for project builds
  --check                      check types
  --editor-client              build client side of editor
  --editor-server              build server side of editor
  --engine                     build engine code
  --test                       run unit tests
  --type-declarations          generate type declarations (for projects)
  --watch                      watch files and automatically rebuild
`)
        process.exit(2)
      case "--test":
        runTests = true
        break
      case "--type-declarations":
        generateTypeDeclarations = true
        break
      case "--watch":
        watch = true
        break
      default:
        throw new Error(`Unsupported option: ${option}`)
    }
  }

  const buildSomething = buildBuildTools || buildEditorClient || buildEditorServer || buildEngine || checkTypes || generateTypeDeclarations || runTests
  if (!buildSomething) {
    buildBuildTools = true
    buildEditorClient = true
    buildEditorServer = true
    buildEngine = true
  }

  const builders: Builder[] = []
  if (buildBuildTools) {
    builders.push(await getBuildToolsBuilder())
  }
  if (buildEditorClient) {
    builders.push(await getEditorClientBuilder())
    builders.push(await getEditorPlayerBuilder())
  }
  if (buildEditorServer) {
    builders.push(await getEditorServerBuilder())
  }
  if (buildEngine) {
    builders.push(await getEngineBuilder())
  }
  if (checkTypes) {
    builders.push(await getCheckTypesBuilder())
  }
  if (generateTypeDeclarations) {
    builders.push(await getTypeDeclarationBuilder())
  }
  if (runTests) {
    builders.push(await getRunTestsBuilder())
  }

  const buildAll = makeBuildAll(builders)

  if (watch) {
    const watchList = builders.reduce((l, b) => [...l, ...b.watchList], [] as readonly string[])
    chokidar.watch(watchList, {
      ignoreInitial: true
    }).on("all", (event, path) => {
      // This timeout gives the parent process a moment to shut us down before double printing.
      setTimeout(() => {
        console.info(`Change detected: ${path}`)
        buildAll()
      }, 10)
    })
  }
  await buildAll()
  if (!watch) {
    await Promise.all(builders.map(b => b.close ? b.close() : undefined))
  }
}
