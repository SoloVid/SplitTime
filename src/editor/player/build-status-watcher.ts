import { debug, error, warn } from "api/system"
import { Status } from "build-tools/project/status"
import { useEffect, useState } from "preact/hooks"
import type { ServerLiaison } from "../client/server-liaison"
import { ConsoleEntry, PopupState } from "./player-state"

type Options = {
  serverLiaison: ServerLiaison
  setPopup: (popup: PopupState) => void
  addConsoleEntry: (entry: ConsoleEntry) => void
}

export type BuildStatusWatcher = {
  update: () => PromiseLike<void>
}

const refreshPageHtml = "Press F5 to <a href='javascript:window.location.reload()'>refresh the page</a>."
const openConsoleDrawer = "Press F9 to <a href='javascript:window._openPlayerConsoleDrawer()'>open the console</a>."

export function makeBuildStatusWatcher({
  serverLiaison,
  setPopup,
  addConsoleEntry,
}: Options): BuildStatusWatcher {
  let firstRun = true
  let lastBuildId: string | null = null
  let lastStatus: Status | null = null
  let knownErrorLogs: string[] = []
  return {
    async update() {
      try {
        const lastLastBuildId = lastBuildId
        const lastLastStatus = lastStatus
        const buildStatus = await serverLiaison.api.buildStatus.fetch(serverLiaison.withProject({
          lastBuildId: lastBuildId ?? undefined,
          knownErrorLogs: knownErrorLogs,
        }))
        if (buildStatus.buildId !== lastBuildId) {
          lastBuildId = buildStatus.buildId
          lastStatus = null
          knownErrorLogs = []
        }
        for (const [logName, logContents] of Object.entries(buildStatus.errorLogs)) {
          error(`error in ${logName}`)
          error(logContents)
          knownErrorLogs.push(logName)
        }
        if (buildStatus.status !== lastStatus) {
          lastStatus = buildStatus.status
          if (lastStatus === "building") {
            debug(`Build ${buildStatus.buildId} running...`)
            // addConsoleEntry({ entryType: "info", text: `Build ${buildStatus.buildId} running...` })
            setPopup({ isVisible: true, messageType: "info", htmlContent: `<i class="fas fa-cog fa-solid fa-spin"></i> Building...` })
          } else if (lastStatus === "failed") {
            error(`Build ${buildStatus.buildId} failed!`)
            // addConsoleEntry({ entryType: "error", text: `Build ${buildStatus.buildId} failed!` })
            setPopup({ isVisible: true, messageType: "error", htmlContent: `Build failed! ${openConsoleDrawer}` })
          } else if (lastStatus === "built-with-errors") {
            warn(`Build ${buildStatus.buildId} encountered some errors in post-build checking`)
            // addConsoleEntry({ entryType: "warning", text: `Build ${buildStatus.buildId} passed with some errors` })
            setPopup({ isVisible: true, messageType: "error", htmlContent: `Errors detected in build! ${openConsoleDrawer}` })
          } else if (lastStatus === "built-but-testing" && !firstRun) {
            debug(`Build ${buildStatus.buildId} ready`)
            // addConsoleEntry({ entryType: "info", text: `Build ${buildStatus.buildId} ready` })
            setPopup({ isVisible: true, messageType: "success", htmlContent: `New build ready! ${refreshPageHtml}` })
          } else if (lastStatus === "succeeded" && !firstRun) {
            debug(`Build ${buildStatus.buildId} succeeded`)
            if (lastLastBuildId !== lastBuildId || lastLastStatus !== "built-but-testing") {
              setPopup({ isVisible: true, messageType: "success", htmlContent: `New build ready! ${refreshPageHtml}` })
            }
          }
        }
      } catch (e) {
        error(e)
      }
      firstRun = false
    }
  }
}
