import { Immutable } from "engine/utils/immutable"
import { generateUID } from "engine/utils/misc"
import { Coordinates2D, instanceOfCoordinates2D } from "engine/world/level/level-location"
import { useMemo, useState } from "preact/hooks"
import { inGroup, safeExtractTraceArray } from "../editor-functions"
import { GridSnapMover } from "../grid-snap-mover"
import RenderedTrace, { IRenderedTraceTracker } from "../rendered-trace"
import { EditorTraceEntity } from "./extended-level-format"
import { SharedStuff } from "./level-editor-shared"

type RenderedLevelTraceProps = {
  levelEditorShared: SharedStuff
  trace: Immutable<EditorTraceEntity>
  transform?: string
}

export default function RenderedLevelTrace(props: RenderedLevelTraceProps) {
  const {
    levelEditorShared,
    trace,
  } = props

  const level = levelEditorShared.level
  const activeGroup = levelEditorShared.activeGroup

  const tracker: IRenderedTraceTracker = {
    track: (e, p) => trackInternal(p)
  }
  const [uid] = useState(generateUID())

  const acceptMouse = useMemo(() => {
    return inGroup(level, activeGroup?.obj.id ?? "", trace.obj)
  }, [level, activeGroup, trace])

  const pointsArray = useMemo(() => {
    return safeExtractTraceArray(level, trace.obj.vertices)
  }, [level, trace.obj.vertices])

  const shouldDragBePrevented = levelEditorShared.shouldDragBePrevented()

  function trackInternal(point?: Coordinates2D): void {
    if(shouldDragBePrevented) {
      return
    }
    const originalPointString = trace.obj.vertices
    const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
    const vertices = safeExtractTraceArray(level, trace.obj.vertices)
    const originalPoints = point ? [point] : vertices.filter(instanceOfCoordinates2D)
    const snappedMover = new GridSnapMover(levelEditorShared.globalStuff.gridCell, originalPoints)
    const follower = {
      shift: (dx: number, dy: number) => {
        snappedMover.applyDelta(dx, dy)
        const snappedDelta = snappedMover.getSnappedDelta()
        var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g
        if (originalPoint) {
          regex = new RegExp("\\((" + originalPoint.x + "),\\s*(" + originalPoint.y + ")\\)", "g")
        }
        const newVertices = originalPointString.replace(regex, function(match, p1, p2) {
          var newX = Number(p1) + snappedDelta.x
          var newY = Number(p2) + snappedDelta.y
          return "(" + newX + ", " + newY + ")"
        })
        trace.setObj((before) => ({
          ...before,
          vertices: newVertices,
        }), `vertex:${JSON.stringify(originalPoint)}`)
      }
    }
    levelEditorShared.follow(follower)
    levelEditorShared.setPropertiesPanel(trace)
  }

  return <RenderedTrace
    acceptMouse={acceptMouse}
    metadata={trace.metadata}
    setMetadata={trace.setMetadata}
    pointsArray={pointsArray}
    server={levelEditorShared.globalStuff.server}
    shouldDragBePrevented={shouldDragBePrevented}
    trace={trace.obj}
    tracker={tracker}
    transform={props.transform}
  />
}
