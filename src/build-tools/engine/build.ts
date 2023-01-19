import { debounce } from "build-tools/common/debounce"
import chokidar from "chokidar"
import type { Builder } from "./builder"
import { getEngineBuilder } from "./engine-builder"
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
  let buildEngine = false
  let generateTypeDeclarations = false

  const args = process.argv.slice(2)
  if (args.length === 0) {
    buildEngine = true
  }
  while (args.length > 0) {
    const option = args.shift()
    switch (option) {
      case "--all":
        buildEngine = true
        generateTypeDeclarations = true
        break
      case "--engine":
        buildEngine = true
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

  const buildSomething = buildEngine

  const builders: Builder[] = []
  if (buildEngine) {
    builders.push(await getEngineBuilder())
  }
  if (generateTypeDeclarations) {
    builders.push(await getTypeDeclarationBuilder())
  }

  const debouncedBuilders = builders.map(b => ({
    ...b,
    run: debounce(b.run, 50),
  }))
  const peopleWatching = new Map<unknown, number>()
  function imWatching(p: unknown) {
    const currentCount = peopleWatching.get(p) ?? 0
    peopleWatching.set(p, currentCount + 1)
  }
  function imDoneWatching(p: unknown) {
    const currentCount = peopleWatching.get(p) ?? 1
    if (currentCount <= 1) {
      peopleWatching.delete(p)
    } else {
      peopleWatching.set(p, currentCount - 1)
    }
  }
  function howManyWatching(p: unknown) {
    return peopleWatching.get(p) ?? 0
  }

  let currentBuildNumber = 0
  // let howManyGoing = 0
  const buildAll = async () => {
    const fullStart = performance.now()
    currentBuildNumber++
    // howManyGoing++
    const myBuild = currentBuildNumber
    try {
      await Promise.all(debouncedBuilders.map(async b => {
        let promise: PromiseLike<number> = Promise.resolve(0)
        let duration = 0
        try {
          promise = b.run()
          imWatching(promise)
          try {
            duration = await promise
          } finally {
            imDoneWatching(promise)
          }
          if (howManyWatching(promise) === 0) {
            greenInfo(`${currentBuildNumber > myBuild ? "(stale) " : ""}${b.name} finished in ${Math.round(duration)} ms`)
          }
        } catch (e) {
          if (howManyWatching(promise) === 0) {
            redError(`${currentBuildNumber > myBuild ? "(stale) " : ""}${b.name} failed`)
            if (b.printErrors) {
              console.error(e)
            }
          }
        }
      }))
    } finally {
      // howManyGoing--
      if (currentBuildNumber === myBuild && builders.length > 1) {
        const fullDuration = Math.round(performance.now() - fullStart)
        cyanInfo(`${builders.length} builds finished after ${fullDuration} ms`)
      }
    }
  }
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
}

function redError(message: string) {
  console.error("\x1b[31m%s\x1b[0m", message);
}
function greenInfo(message: string) {
  console.info("\x1b[32m%s\x1b[0m", message);
}
function cyanInfo(message: string) {
  console.info("\x1b[36m%s\x1b[0m", message);
}
