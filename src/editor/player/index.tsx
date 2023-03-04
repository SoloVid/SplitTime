import "preact/debug";

import { render } from "preact";
import { exerciseApi } from "../client/test";
import { ServerLiaison } from "../client/server-liaison";
import { useEffect, useState } from "preact/hooks";
import { makeBuildStatusWatcher } from "./build-status-watcher";
import BuildStatusPopup from "./build-status-popup";
import ConsoleDrawer from "./console-drawer";
import { ConsoleEntry, PlayerState } from "./player-state";
import { LogListener, registerLogListener, unregisterLogListener } from "api/system";
import { logArgsToHtmlString } from "./console-text-helper";

const slug = "edit"
const url = window.location.href
// Expecting URL of form /edit/path/to/file.ext
const initialFilePath = url.substring(url.indexOf(slug) + slug.length)

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
