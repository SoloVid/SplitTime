import { Montage as FileMontage } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { Trace as FileTrace } from "engine/world/level/level-file-data"
import { TraceType, TraceTypeType } from "engine/world/level/trace/trace-type"
import { useContext, useMemo, useRef } from "preact/hooks"
import { InfoPaneContext } from "../common/info-pane"
import { UserInputsContext, getRelativeMouse } from "../common/user-inputs"
import { DEFAULT_GROUP_HEIGHT } from "../editor-functions"
import { FileCollage } from "../file-types"
import { ImmutableSetter } from "../utils/preact-help"
import { useJsonableMemo } from "../utils/use-jsonable-memo"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import { markEventAsPropertiesSet } from "./event-properties-set"
import { findTraceInCollage, updateTraceInCollage } from "./find-trace"
import { Rect } from "engine/math/rect"

type Props = {
  children: any
  collage: FileCollage
  editAffectsAllFrames: boolean
  frameTargetBox: Rect
  montage: Immutable<FileMontage>
  scale: number
  setCollage?: ImmutableSetter<FileCollage>
  traceIdInProgress?: string | null
  setTraceIdInProgress?: (id: string | null) => void
}

export default function MontageFrameMouseEventsHandler(props: Props) {
  const {
    children,
    collage,
    editAffectsAllFrames,
    frameTargetBox,
    montage,
    scale,
    setCollage,
    traceIdInProgress,
    setTraceIdInProgress,
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

  const [collagePrefs, setCollagePrefs] = useContext(CollageEditorPreferencesContext)

  const addNewTrace = useMemo(() => (montage: FileMontage, type: TraceTypeType): FileTrace => {
    const z = 0
    const defaultHeight = DEFAULT_GROUP_HEIGHT
    let height = defaultHeight
    if(type === TraceType.GROUND) {
      type = TraceType.SOLID
      height = 0
    }
    const t = {
      id: "",
      name: "",
      group: "",
      type: type,
      vertices: "",
      z: z,
      height: height,
      direction: "",
      event: "",
      level: "",
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      targetPosition: "",
      color: "",
    }
    setCollage?.((before) => ({
      ...before,
      montages: before.montages.map((m, i) => {
        if (m.id !== montage.id) {
          return m
        }
        return {
          ...m,
          traces: [...m.traces, t],
        }
      }),
    }))
    return t
  }, [setCollage])

  const handleMouseUp = useMemo(() => (event: MouseEvent): void => {
    // FTODO: Allow editing from animated montage
    // Right now, there are some issues with position for montages in showcase
    if (!setTraceIdInProgress || !setCollage || editAffectsAllFrames || !inputs) {
      return
    }

    const y = inputs.mouse.y
    const x = inputs.mouse.x
    const isLeftClick = event.which === 1
    const isRightClick = event.which === 3

    const gridCell = { x: 1, y: 1 }
    const snappedX = Math.round(x / gridCell.x) * gridCell.x
    const snappedY = Math.round(y / gridCell.y) * gridCell.y
    const literalPoint = "(" +
      Math.floor(snappedX) + ", " +
      Math.floor(snappedY) + ")"
    const traceInProgress = traceIdInProgress ? findTraceInCollage(collage, traceIdInProgress) : null
    const traceType = collagePrefs.traceType
    if(isLeftClick) {
      if(traceInProgress) {
        updateTraceInCollage(setCollage, traceInProgress.id, (before) => ({
          ...before,
          vertices: before.vertices + " " + literalPoint,
        }))
        markEventAsPropertiesSet(event)
      }
    } else if(isRightClick) {
      if(!traceInProgress) {
        const trace = addNewTrace(montage, traceType)
        trace.vertices = literalPoint
        setTraceIdInProgress(trace.id)
        setCollagePrefs((before) => ({
          ...before,
          propertiesPanel: {
            type: "trace",
            id: trace.id,
          },
        }))
        markEventAsPropertiesSet(event)
      } else {
        if(!inputs.ctrlDown) {
          updateTraceInCollage(setCollage, traceInProgress.id, (before) => ({
            ...before,
            vertices: before.vertices + " (close)",
          }))
        }
        setTraceIdInProgress(null)
        markEventAsPropertiesSet(event)
      }
    }
  }, [addNewTrace, collage, collagePrefs.traceType, editAffectsAllFrames, inputs, setCollage, setCollagePrefs, setTraceIdInProgress, traceIdInProgress])

  const [info, setInfo] = useContext(InfoPaneContext)

  const handleMouseMove = useMemo(() => (event: MouseEvent): void => {
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


  return <div className="montage-frame-mouse-events-handler"
    ref={$el}
    onContextMenu={(e) => e.preventDefault()}
    onMouseUp={handleMouseUp}
    onMouseMove={handleMouseMove}
    onMouseOut={handleMouseOut}
  >
    {children}
  </div>
}
