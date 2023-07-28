import { Montage, MontageFrame } from "engine/file/collage"
import { generateUID } from "engine/utils/misc"
import { Trace } from "engine/world/level/level-file-data"
import { Coordinates2D, instanceOfCoordinates2D } from "engine/world/level/level-location"
import { convertPositions, interpretPointString } from "engine/world/level/trace/trace-points"
import { useContext, useMemo, useState } from "preact/hooks"
import RenderedTrace, { IRenderedTraceTracker } from "../common/rendered-trace"
import { UserInputsContext } from "../common/user-inputs"
import { FileCollage } from "../file-types"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { GridSnapMover } from "../utils/grid-snap-mover"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import { markEventAsPropertiesSet } from "./event-properties-set"
import { coalescePreferencesGridCell } from "../preferences/grid"

type RenderedMontageTraceProps = {
  collage: FileCollage
  montage: Montage
  montageFrame: MontageFrame
  scale: number
  traceIndex: number
  trace: Trace
  transform: string
}

export default function RenderedMontageTrace(props: RenderedMontageTraceProps) {
  const {
    collage,
    montage,
    montageFrame,
    scale,
    trace,
    transform,
  } = props

  const [globalPrefs] = useContext(GlobalEditorPreferencesContext)
  const [collagePrefs, setCollagePrefs] = useContext(CollageEditorPreferencesContext)
  const userInputs = useContext(UserInputsContext)

  const tracker: IRenderedTraceTracker = {
    track: (e, p) => {
      trackInternal(p)
      markEventAsPropertiesSet(e)
    }
  }
  const [uid] = useState(generateUID())
  const acceptMouse = true

  const pointsArray = useMemo<(Readonly<Coordinates2D> | null)[]>(() => {
    const pointSpecs = interpretPointString(trace.vertices)
    return convertPositions(pointSpecs, {})
  }, [trace.vertices])

  const shouldDragBePrevented = false

  function trackInternal(point?: Coordinates2D): void {
    const originalPointString = trace.vertices
    const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
    const vertices = pointsArray
    const originalPoints = point ? [point] : vertices.filter(instanceOfCoordinates2D)
    const snappedMover = new GridSnapMover(coalescePreferencesGridCell(globalPrefs), originalPoints)
    const follower = {
      shift: (dx: number, dy: number) => {
        const dxScaled = dx / scale
        const dyScaled = dy / scale
        snappedMover.applyDelta(dxScaled, dyScaled)
        const snappedDelta = snappedMover.getSnappedDelta()
        var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g
        if (originalPoint) {
          regex = new RegExp("\\((" + originalPoint.x + "),\\s*(" + originalPoint.y + ")\\)", "g")
        }
        trace.vertices = originalPointString.replace(regex, function(match, p1, p2) {
          var newX = Math.round(Number(p1) + snappedDelta.x)
          var newY = Math.round(Number(p2) + snappedDelta.y)
          return "(" + newX + ", " + newY + ")"
        })
      }
    }
    userInputs?.setFollowers(() => [follower])
    setCollagePrefs((before) => ({
      ...before,
      propertiesPanel: {
        type: "trace",
        id: trace.id,
      },
    }))
  }

  return <RenderedTrace
    acceptMouse={acceptMouse}
    displayed={true}
    highlighted={false}
    pointsArray={pointsArray}
    scale={scale}
    shouldDragBePrevented={shouldDragBePrevented}
    trace={trace}
    tracker={tracker}
    transform={transform}
  />
}
