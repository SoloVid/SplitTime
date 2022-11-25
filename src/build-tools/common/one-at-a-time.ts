import { Mutex } from "async-mutex"

export function makeCrowdControl() {
  const mutex = new Mutex()
  let someoneIsWaiting = false

  return {
    async oneAtATime(run: () => PromiseLike<void>) {
      if (someoneIsWaiting) {
        return
      }
      someoneIsWaiting = true
      await mutex.runExclusive(async () => {
        someoneIsWaiting = false
        await run()
      })
    }
  }
}
