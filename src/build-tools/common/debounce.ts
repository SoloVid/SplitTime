export function debounce(run: () => PromiseLike<unknown> | void, debounceMs: number): () => PromiseLike<number> {
  let previous: Promise<number> = Promise.resolve(0)
  let queued: Promise<number> | null = null
  return () => {
    if (!queued) {
      queued = new Promise((resolve, reject) => {
        setTimeout(() => {
          let start = 0
          previous
            .then(() => {
              queued = null
              start = performance.now()
              return run()
            })
            .then(() => performance.now() - start)
            .then(resolve, reject)
          previous = queued ?? Promise.resolve(0)
        }, debounceMs)
      })
    }
    return queued
  }
}
