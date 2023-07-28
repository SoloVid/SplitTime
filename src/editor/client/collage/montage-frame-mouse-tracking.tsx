import { useContext, useMemo } from "preact/hooks"
import { InfoPaneContext } from "../common/info-pane"
import { MontageFrameRelativeInputsContext } from "./montage-frame-relative-inputs"

export default function MontageFrameMouseTracking() {
  
  const inputs = useContext(MontageFrameRelativeInputsContext)
  const [info, setInfo] = useContext(InfoPaneContext)

  const handleMouseMove = useMemo(() => (event: MouseEvent): void => {
    console.log("mouse move")
    if (inputs === null) {
      return
    }
    setInfo((before) => ({
      ...before,
      x: inputs.mouse.x,
      ["y-z"]: inputs.mouse.y,
    }))
  }, [inputs, setInfo])

  const handleMouseOut = useMemo(() => (event: MouseEvent): void => {
    setInfo((before) => {
      const { x, ["y-z"]: y, ...restBefore } = before
      return restBefore
    })
  }, [setInfo])

  return <div className="montage-frame-mouse-tracking absolute-fill"
    onContextMenu={(e) => e.preventDefault()}
    onMouseMove={handleMouseMove}
    onMouseOut={handleMouseOut}
  >
  </div>
}
