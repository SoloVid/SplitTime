import "preact/debug";

import { render } from "preact";
import { exerciseApi } from "../client/test";
import { ServerLiaison } from "../client/server-liaison";
import { useEffect, useState } from "preact/hooks";
import { makeBuildStatusWatcher } from "./build-status-watcher";
import BuildStatusPopup from "./build-status-popup";
import ConsoleDrawer from "./console-drawer";
import { ConsoleEntry, PlayerState } from "./player-state";
import { debug, error, LogListener, registerLogListener, unregisterLogListener } from "api/system";
import { logArgsToHtmlString, unknownToString } from "./console-text-helper";

// The event listeners in the Preact code won't register synchronously
// so they aren't ready soon enough.
const startupErrors: unknown[] = []
const startupErrorListener = (e: ErrorEvent) => {
  startupErrors.push(e.error)
  e.preventDefault()
}
window.addEventListener("error", startupErrorListener)
// If the app fails to start up for some reason, we don't want to lose the errors.
setTimeout(() => {
  if (startupErrors.length > 0) {
    for (const e of startupErrors) {
      error(e)
    }
  }
}, 500)

Promise.resolve().then(() => exerciseApi())

function App() {
  const serverLiaison = new ServerLiaison("")

  const [playerState, setPlayerState] = useState<PlayerState>({
    consoleDrawer: {
      isVisible: false,
      height: 200,
      entries: [],
    },
    popup: {
      isVisible: false,
      messageType: "success",
      htmlContent: "Build Status Here",
    }
  })

  function addConsoleEntry(entry: ConsoleEntry) {
    setPlayerState(old => ({
      ...old,
      consoleDrawer: {
        ...old.consoleDrawer,
        // We're putting these in reverse order because we're using
        // `flex-direction: column-reverse` in the CSS (for UX reasons).
        entries: [entry, ...old.consoleDrawer.entries],
      }
    }))
  }

  useEffect(() => {
    const listener: LogListener = {
      onDebug: (...args) => addConsoleEntry({ entryType: "info", text: logArgsToHtmlString(args) }),
      onWarn: (...args) => addConsoleEntry({ entryType: "warning", text: logArgsToHtmlString(args) }),
      onError: (...args) => {
        addConsoleEntry({ entryType: "error", text: logArgsToHtmlString(args) })
        if (!playerState.popup.isVisible || playerState.popup.messageType !== "error") {
          setPlayerState(old => ({
            ...old,
            popup: {
              isVisible: true,
              messageType: "error",
              htmlContent: "Error! Press F9 to open the console.",
            }
          }))
        }
      },
    }
    registerLogListener(listener)
    return () => unregisterLogListener(listener)
  }, [playerState.popup.isVisible, playerState.popup.messageType])

  useEffect(() => {
    const listener = (e: ErrorEvent | PromiseRejectionEvent) => {
      if (e instanceof ErrorEvent && e.message.includes("ResizeObserver loop limit exceeded")) {
        // Ignore this error. It regularly comes up when opening dev tools but doesn't trigger console error.
        // See https://stackoverflow.com/a/50387233/4639640
        return
      }
      if ("reason" in e) {
        addConsoleEntry({ entryType: "error", text: unknownToString(e.reason) })
      } else {
        addConsoleEntry({ entryType: "error", text: unknownToString(e.error) })
      }
    }
    window.addEventListener("error", listener)
    window.addEventListener("unhandledrejection", listener)
    for (const e of startupErrors) {
      error(e)
    }
    startupErrors.length = 0
    window.removeEventListener("error", startupErrorListener)
    return () => {
      window.removeEventListener("unhandledrejection", listener)
      window.removeEventListener("error", listener)
    }
  })

  useEffect(() => {
    const watcher = makeBuildStatusWatcher({
      serverLiaison,
      setPopup: (p) => setPlayerState(old => ({ ...old, popup: p })),
      addConsoleEntry,
    })
    const intervalHandle = setInterval(async () => {
      await watcher.update()
    }, 500)
    return () => clearInterval(intervalHandle)
  }, [])

  useEffect(() => {
    const toggleDrawer = (target?: boolean) => {
      setPlayerState(old => ({
        ...old,
        consoleDrawer: { ...old.consoleDrawer, isVisible: target ?? !old.consoleDrawer.isVisible }
      }))
    }
    const listener = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        setPlayerState(old => ({
          ...old,
          consoleDrawer: { ...old.consoleDrawer, isVisible: !old.consoleDrawer.isVisible }
        }))
      }
    }
    (window as unknown as Record<string, unknown>)["_openPlayerConsoleDrawer"] = () => toggleDrawer(true)
    window.addEventListener("keyup", listener)
    return () => window.removeEventListener("keyup", listener)
  }, [])

  return <div>
    {playerState.popup.isVisible && <BuildStatusPopup
      state={playerState.popup}
      setState={(modifyPopupState) => setPlayerState(old => ({...old, popup: modifyPopupState(old.popup)}))} 
    />}
    TODO: Actually put the game in here or something.
    {playerState.consoleDrawer.isVisible && <ConsoleDrawer
      state={playerState.consoleDrawer}
      setState={(modifyConsoleDrawerState) => setPlayerState(old => ({...old, consoleDrawer: modifyConsoleDrawerState(old.consoleDrawer)}))} 
    />}
  </div>
}

render(<App />, document.getElementById('app') as HTMLElement);
