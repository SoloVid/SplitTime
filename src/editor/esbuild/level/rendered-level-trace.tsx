import { Immutable } from "engine/utils/immutable"
import { generateUID } from "engine/utils/misc"
import { Coordinates2D, instanceOfCoordinates2D } from "engine/world/level/level-location"
import { useMemo, useState } from "preact/hooks"
import { inGroup, safeExtractTraceArray } from "../editor-functions"
import { FileTrace } from "../file-types"
import { GridSnapMover } from "../grid-snap-mover"
import { ImmutableSetter, makeImmutableObjectSetterUpdater } from "../preact-help"
import RenderedTrace, { IRenderedTraceTracker } from "../rendered-trace"
import { EditorMetadata } from "../shared-types"
import { SharedStuff } from "./level-editor-shared"

type RenderedLevelTraceProps = {
  levelEditorShared: SharedStuff
  metadata: Immutable<EditorMetadata>
  traceIndex: number
  trace: Immutable<FileTrace>
  setTrace: ImmutableSetter<FileTrace>
  transform?: string
}

export default function RenderedLevelTrace(props: RenderedLevelTraceProps) {
  const {
    levelEditorShared,
    metadata,
    traceIndex,
    trace,
    setTrace,
  } = props

  const level = levelEditorShared.level
  const activeGroup = levelEditorShared.activeGroup
  const updateTrace = makeImmutableObjectSetterUpdater(setTrace)

  const tracker: IRenderedTraceTracker = {
    track: (e, p) => trackInternal(p)
  }
  const [uid] = useState(generateUID())

  const acceptMouse = useMemo(() => {
    return inGroup(level, activeGroup, trace)
  }, [level, activeGroup, trace])

  const pointsArray = useMemo(() => {
    return safeExtractTraceArray(level, trace.vertices)
  }, [level, trace.vertices])

  const shouldDragBePrevented = levelEditorShared.shouldDragBePrevented()

  function trackInternal(point?: Coordinates2D): void {
    if(shouldDragBePrevented) {
      return
    }
    const originalPointString = trace.vertices
    const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
    const vertices = safeExtractTraceArray(level, trace.vertices)
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
        updateTrace({vertices: newVertices})
      }
    }
    levelEditorShared.follow(follower)
    levelEditorShared.setPropertiesPath(["traces", traceIndex])
  }

  return <RenderedTrace
    acceptMouse={acceptMouse}
    metadata={metadata}
    pointsArray={pointsArray}
    server={levelEditorShared.globalStuff.server}
    shouldDragBePrevented={shouldDragBePrevented}
    trace={trace}
    tracker={tracker}
    transform={props.transform}
  />
}
