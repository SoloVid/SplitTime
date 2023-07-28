import { Rect } from "engine/math/rect";
import { createContext } from "preact";
import { useContext, useMemo, useRef } from "preact/hooks";
import { UserInputsContext, getRelativeMouse } from "../common/user-inputs";
import { useJsonableMemo } from "../utils/use-jsonable-memo";

export type MontageFrameRelativeInputs = {
  mouse: {
    x: number
    y: number
    isDown: boolean
  }
  ctrlDown: boolean
}

export const MontageFrameRelativeInputsContext = createContext<MontageFrameRelativeInputs | null>(null)

type Props = {
  children: any
  frameTargetBox: Rect
  scale: number
}

export function MontageFrameRelativeInputsContextProvider(props: Props) {
  const {
    frameTargetBox,
    scale,
  } = props

  const $el = useRef<HTMLDivElement>(document.createElement("div"))

  const editorInputs = useContext(UserInputsContext)

  const basicRelMouse = useJsonableMemo(() => {
    if (!editorInputs) {
      return null
    }
    return getRelativeMouse(editorInputs, $el.current)
  }, [$el.current, editorInputs])

  const inputs = useMemo(() => {
    if (editorInputs === null || basicRelMouse === null) {
      return {
        mouse: { x: 0, y: 0, isDown: false },
        ctrlDown: false,
      }
    }

    const mouse = {
      x: Math.round((basicRelMouse.x / scale) + frameTargetBox.x),
      y: Math.round((basicRelMouse.y / scale) + frameTargetBox.y),
      isDown: editorInputs.mouse.isDown
    }
    return {
      mouse,
      ctrlDown: editorInputs.ctrlDown
    }
  }, [basicRelMouse, editorInputs, frameTargetBox, scale])

  return <>
    <div className="montage-frame-relative-inputs absolute-fill"
      ref={$el}
    >
    </div>
    <MontageFrameRelativeInputsContext.Provider value={inputs}>
      {props.children}
    </MontageFrameRelativeInputsContext.Provider>
  </>
}
