import { error } from "./utils/logger"

export function exposeLaunchPoint(launch: (attachId: string) => void | PromiseLike<void>) {
  (window as unknown as Record<string, unknown>)["launchGame"] = (attachId: string) => {
    Promise.resolve(launch(attachId)).then(() => {
      // Do nothing.
    }, (e) => {
      error(e)
    })
  }
}
