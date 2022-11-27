import { Montage, MontageFrame } from "engine/file/collage"
import { generateUID } from "engine/utils/misc"
import { Trace } from "engine/world/level/level-file-data"
import { Coordinates2D, instanceOfCoordinates2D } from "engine/world/level/level-location"
import { convertPositions, interpretPointString } from "engine/world/level/trace/trace-points"
import { useMemo, useState } from "preact/hooks"
import { GridSnapMover } from "../grid-snap-mover"
import RenderedTrace, { IRenderedTraceTracker } from "../rendered-trace"
import { EditorMetadata } from "../shared-types"
import { SharedStuffViewOnly, SharedStuff } from "./collage-editor-shared"
import { PropertiesEvent } from "./shared-types"

type RenderedMontageTraceProps = {
  collageEditHelper: SharedStuff
  collageViewHelper: SharedStuffViewOnly
  montageIndex: number
  montage: Montage
  montageFrame: MontageFrame
  traceIndex: number
  trace: Trace
  transform: string
}

export default function RenderedMontageTrace(props: RenderedMontageTraceProps) {
  const {
    collageEditHelper,
    collageViewHelper,
    montageIndex,
    montage,
    montageFrame,
    traceIndex,
    trace,
    transform,
  } = props

  const [metadata, setMetadata] = useState(new EditorMetadata())
  const tracker: IRenderedTraceTracker = {
    track: (e, p) => {
      trackInternal(p)
      // Somewhat type-unsafe way of letting upper events know they should try to set properties
      const anyEvent = e as PropertiesEvent
      anyEvent.propertiesPanelSet = true
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
    const snappedMover = new GridSnapMover(collageEditHelper.globalStuff.gridCell, originalPoints)
    const follower = {
      shift: (dx: number, dy: number) => {
        snappedMover.applyDelta(dx, dy)
        const snappedDelta = snappedMover.getSnappedDelta()
        var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g
        if (originalPoint) {
          regex = new RegExp("\\((" + originalPoint.x + "),\\s*(" + originalPoint.y + ")\\)", "g")
        }
        trace.vertices = originalPointString.replace(regex, function(match, p1, p2) {
          var newX = Number(p1) + snappedDelta.x
          var newY = Number(p2) + snappedDelta.y
          return "(" + newX + ", " + newY + ")"
        })
      }
    }
    collageEditHelper.follow(follower)
    collageEditHelper.setPropertiesPath(["montages", montageIndex, "traces", traceIndex])
  }

  return <RenderedTrace
    acceptMouse={acceptMouse}
    metadata={metadata}
    pointsArray={pointsArray}
    server={collageViewHelper.globalStuff.server}
    shouldDragBePrevented={shouldDragBePrevented}
    trace={trace}
    tracker={tracker}
    transform={transform}
  />
}
