import { Montage as FileMontage } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { Trace as FileTrace } from "engine/world/level/level-file-data"
import { TraceType, TraceTypeType } from "engine/world/level/trace/trace-type"
import { useContext, useMemo } from "preact/hooks"
import { DEFAULT_GROUP_HEIGHT } from "../editor-functions"
import { FileCollage } from "../file-types"
import { ImmutableSetter } from "../utils/preact-help"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import { markEventAsPropertiesSet } from "./event-properties-set"
import { findTraceInCollage, updateTraceInCollage } from "./find-trace"
import { MontageFrameRelativeInputsContext } from "./montage-frame-relative-inputs"

type MontageTracesProps = {
  collage: FileCollage
  editAffectsAllFrames: boolean
  montage: Immutable<FileMontage>
  setCollage?: ImmutableSetter<FileCollage>
  traceIdInProgress?: string | null
  setTraceIdInProgress?: (id: string | null) => void
}

export default function MontageTraces(props: MontageTracesProps) {
  const {
    collage,
    editAffectsAllFrames,
    montage,
    setCollage,
    traceIdInProgress,
    setTraceIdInProgress,
  } = props

  const inputs = useContext(MontageFrameRelativeInputsContext)

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

  return <div className="montage-traces absolute-fill"
    onContextMenu={(e) => e.preventDefault()}
    onMouseUp={handleMouseUp}
  >
  </div>
}
