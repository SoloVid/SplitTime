import { keycode } from "api/controls";
import { debug } from "api/system";
import { createContext } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useSetIntervalWhenActive } from "./utils/use-set-interval-when-active";
import { Coordinates2D } from "engine/world/level/level-location";
import { getCoords } from "./editor-functions";
import { ImmutableSetter } from "./preact-help";

export interface Followable {
  shift(dx: number, dy: number): void
}

export type UserInputs = {
  readonly mouse: {
    readonly x: number,
    readonly y: number,
    readonly isDown: boolean
  }
  readonly ctrlDown: boolean
}

export function getRelativeMouse(userInputs: UserInputs, $el: HTMLElement): Coordinates2D {
  const pos = getCoords($el)
  return {
    x: Math.round(userInputs.mouse.x - pos.left),
    y: Math.round(userInputs.mouse.y - pos.top),
  }
}

export type UserInputs2 = {
  /** Note: Mouse values NOT scaled by zoom. */
  readonly mouse: {
    readonly x: number
    readonly y: number
    readonly isDown: boolean
  }
  readonly ctrlDown: boolean

  readonly setFollowers: ImmutableSetter<readonly Followable[] | null>
}

export const UserInputsContext = createContext<UserInputs2 | null>(null)

export function UserInputsContextProvider({ children }: { children: any }) {
  const [time, setTime] = useState(0)

  const TIME_INTERVAL = 50;
  useSetIntervalWhenActive(() => {
    setTime((oldTime) => oldTime += TIME_INTERVAL / 1000)
  }, TIME_INTERVAL, [])


  const [followers, setFollowersInternal] = useState<readonly Followable[] | null>(null)
  const [previousFollowers, setPreviousFollowers] = useState<readonly Followable[] | null>(null)

  const setFollowers: ImmutableSetter<null | readonly Followable[]> = (transform) => {
    setFollowersInternal((before) => {
      setPreviousFollowers(before)
      const after = transform(before)
      return after
    })
  }

  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    isDown: false
  })
  const [ctrlDown, setCtrlDown] = useState(false)

  function moveFollowers(dx: number, dy: number, fallbackToPrevious: boolean = true): void {
    let toMove = followers
    if (fallbackToPrevious && toMove === null) {
      toMove = previousFollowers
    }
    if (toMove === null) {
      toMove = []
    }
    for (const t of toMove) {
      t.shift(dx, dy)
    }
  }

  function handleMouseMove(event: MouseEvent): void {
    setMouse((before) => {
      const newX = Math.round(event.pageX)
      const newY = Math.round(event.pageY)
      const oldX = before.x
      const oldY = before.y
      const dx = newX - oldX
      const dy = newY - oldY
      moveFollowers(dx, dy, false)
      return {
        ...before,
        x: newX,
        y: newY,
      }
    })
    // TODO: prevent default?
  }

  function handleMouseDown(event: MouseEvent): void {
    setMouse({
      ...mouse,
      isDown: true
    })
  }

  function handleMouseUp(event: MouseEvent): void {
    setMouse({
      ...mouse,
      isDown: false
    })
    if (followers !== null) {
      setFollowers(null)
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.which === keycode.S) {
      if (event.ctrlKey || ctrlDown) {
        doSave(filePath)
        event.preventDefault()
      }
    }

    // TODO: resolve types
    const element = event.target as any
    switch (element.tagName.toLowerCase()) {
      case "input":
      case "textarea":
        return
    }
    const ctrlKey = event.ctrlKey || event.metaKey

    var specialKey = true
    switch (event.which) {
      case keycode.DEL:
        onDeleteCallback.f()
        break;
      case keycode.CTRL:
      case keycode.SHIFT:
        setCtrlDown(true)
        break
      case keycode.LEFT:
        moveFollowers(-gridCell.x * globalEditorStuff.scale, 0)
        break
      case keycode.UP:
        moveFollowers(0, -gridCell.y * globalEditorStuff.scale)
        break
      case keycode.RIGHT:
        moveFollowers(gridCell.x * globalEditorStuff.scale, 0)
        break
      case keycode.DOWN:
        moveFollowers(0, gridCell.y * globalEditorStuff.scale)
        break
      default:
        specialKey = false
    }

    if (specialKey) {
      event.preventDefault()
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (event.which == keycode.SHIFT || event.which === keycode.CTRL) {
      setCtrlDown(false)
    } else if (event.which == keycode.ESC) {
      if (level !== null) {
        debug("export of level JSON:")
        debug(level)
      } else if (collage !== null) {
        debug("export of collage JSON:")
        debug(collage)
      } else {
        debug("nothing to export")
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  })

  const value: UserInputs2 = {
    mouse: mouse,
    ctrlDown: ctrlDown,
    setFollowers: setFollowers
  }

  return <div
    onMouseMove={handleMouseMove}
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    style="width: 100%; height: 100%;"
  >
    <UserInputsContext.Provider value={value}>
      {children}
    </UserInputsContext.Provider>
  </div>
}
