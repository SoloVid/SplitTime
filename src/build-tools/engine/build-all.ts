import { cyanInfo, greenInfo, redError } from "../common/color-output"
import { debounce } from "../common/debounce"
import type { Builder } from "./builder"

export function makeBuildAll(builders: readonly Builder[]) {
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
  const buildAll = async () => {
    const fullStart = performance.now()
    currentBuildNumber++
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
      if (currentBuildNumber === myBuild && builders.length > 1) {
        const fullDuration = Math.round(performance.now() - fullStart)
        cyanInfo(`${builders.length} builds finished after ${fullDuration} ms`)
      }
    }
  }

  return buildAll
}