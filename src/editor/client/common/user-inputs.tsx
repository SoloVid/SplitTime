import { keycode } from "api/controls";
import { Coordinates2D } from "engine/world/level/level-location";
import { createContext } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";
import { getCoords } from "../editor-functions";
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences";
import { coalescePreferencesGridCell } from "../preferences/grid";
import { convertZoomToScale } from "../preferences/scale";
import { ImmutableSetter } from "../utils/preact-help";
import { useKeyListener } from "../utils/use-key-listener";

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

type UserInputsContextProviderProps = {
  children: any
}

export function UserInputsContextProvider({ children }: UserInputsContextProviderProps) {
  const [globalPrefs, setGlobalPrefs] = useContext(GlobalEditorPreferencesContext)

  const [followers, setFollowersInternal] = useState<readonly Followable[] | null>(null)
  const [previousFollowers, setPreviousFollowers] = useState<readonly Followable[] | null>(null)

  const setFollowers: ImmutableSetter<null | readonly Followable[]> = useMemo(() => (transform) => {
    setFollowersInternal((before) => {
      setPreviousFollowers(before)
      const after = transform(before)
      return after
    })
  }, [setFollowersInternal, setPreviousFollowers])

  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    isDown: false
  })
  const [ctrlDown, setCtrlDown] = useState(false)

  const moveFollowers = useMemo(() => (dx: number, dy: number, fallbackToPrevious: boolean = true): void => {
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
  }, [followers, previousFollowers])

  const handleMouseMove = useMemo(() => (event: MouseEvent): void => {
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
  }, [setMouse, moveFollowers])

  const handleMouseDown = useMemo(() => (event: MouseEvent): void => {
    setMouse((before) => ({
      ...before,
      isDown: true
    }))
  }, [setMouse])

  const handleMouseUp = useMemo(() => (event: MouseEvent): void => {
    setMouse((before) => ({
      ...before,
      isDown: false
    }))
    setFollowers(() => null)
  }, [setMouse, setFollowers])

  const gridCell = coalescePreferencesGridCell(globalPrefs)
  const scale = convertZoomToScale(globalPrefs.zoom)

  function handleKeyDown(event: KeyboardEvent): void {
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
      case keycode.LEFT:
        moveFollowers(-gridCell.x * scale, 0)
        break
      case keycode.UP:
        moveFollowers(0, -gridCell.y * scale)
        break
      case keycode.RIGHT:
        moveFollowers(gridCell.x * scale, 0)
        break
      case keycode.DOWN:
        moveFollowers(0, gridCell.y * scale)
        break
      default:
        specialKey = false
    }

    if (specialKey) {
      event.preventDefault()
    }
  }

  useKeyListener("keydown", (event) => {
    if (event.which == keycode.SHIFT || event.which === keycode.CTRL) {
      setCtrlDown(true)
    }
  })

  useKeyListener("keyup", (event) => {
    if (event.which == keycode.SHIFT || event.which === keycode.CTRL) {
      setCtrlDown(false)
    }
  })

  useKeyListener("keydown", handleKeyDown)

  const value: UserInputs2 = useMemo(() => ({
    mouse: mouse,
    ctrlDown: ctrlDown,
    setFollowers: setFollowers
  }), [mouse, ctrlDown, setFollowers])

  return <div
    onMouseMove={handleMouseMove}
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    style="flex: 1; display: flex; overflow: hidden;"
  >
    <UserInputsContext.Provider value={value}>
      {children}
    </UserInputsContext.Provider>
  </div>
}

export function useOnSave(onSave: () => void) {
  useKeyListener("keydown", (event) => {
    if (event.which === keycode.S) {
      if (event.ctrlKey || event.metaKey) {
        onSave()
        event.preventDefault()
      }
    }
  })
}
