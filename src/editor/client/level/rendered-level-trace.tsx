import { Immutable } from "engine/utils/immutable"
import { generateUID } from "engine/utils/misc"
import { Coordinates2D, instanceOfCoordinates2D } from "engine/world/level/level-location"
import { useContext, useMemo, useState } from "preact/hooks"
import { getPositionMap, safeExtractTraceArray, safeExtractTraceArray2 } from "../editor-functions"
import { GridSnapMover } from "../grid-snap-mover"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import RenderedTrace, { IRenderedTraceTracker } from "../rendered-trace"
import { ServerLiaison } from "../server-liaison"
import { useJsonableMemo } from "../utils/use-jsonable-memo"
import { EditorTrace, ObjectMetadata } from "./extended-level-format"
import { LevelFollowerContext } from "./level-follower"
import { LevelEditorPreferencesContext } from "./level-preferences"

type RenderedLevelTraceProps = {
  groupExists: boolean
  metadata: ObjectMetadata
  positionMap: ReturnType<typeof getPositionMap>
  scale: number
  server: ServerLiaison
  shouldDragBePrevented: boolean
  trace: Immutable<EditorTrace>
  transform?: string
}

export default function RenderedLevelTrace(props: RenderedLevelTraceProps) {
  const {
    groupExists,
    metadata,
    positionMap,
    scale,
    server,
    shouldDragBePrevented,
    trace,
  } = props

  const [globalPrefs] = useContext(GlobalEditorPreferencesContext)
  const [levelPrefs, setLevelPrefs] = useContext(LevelEditorPreferencesContext)
  const levelFollower = useContext(LevelFollowerContext)

  const activeGroup = levelPrefs.activeGroup

  const tracker: IRenderedTraceTracker = {
    track: (e, p) => trackInternal(p)
  }
  const [uid] = useState(generateUID())

  const acceptMouse = useMemo(
    () => groupExists ? activeGroup === trace.group : !activeGroup,
    [groupExists, activeGroup, trace]
  )

  const pointsArray = useJsonableMemo(() => {
    return safeExtractTraceArray2(positionMap, trace.vertices)
  }, [positionMap, trace.vertices])

  function trackInternal(point?: Coordinates2D): void {
    if(shouldDragBePrevented || !levelFollower) {
      return
    }
    const originalPointString = trace.vertices
    const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
    const vertices = pointsArray
    const originalPoints = point ? [point] : vertices.filter(instanceOfCoordinates2D)
    const snappedMover = new GridSnapMover(globalPrefs.gridCell, originalPoints)
    levelFollower.trackMoveInLevel((dx, dy, levelBefore) => {
      const dxScaled = dx / scale
      const dyScaled = dy / scale
      snappedMover.applyDelta(dxScaled, dyScaled)
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
      return {
        ...levelBefore,
        traces: levelBefore.traces.map(t => {
          if (t.id !== trace.id) {
            return t
          }
          return {
            ...t,
            vertices: newVertices,
          }
        })
      }
      // trace.setObj((before) => ({
      //   ...before,
      //   vertices: newVertices,
      // }), `vertex:${JSON.stringify(originalPoint)}`)
    })
    setLevelPrefs((before) => ({...before, propertiesPanel: {type: "trace", id: trace.id}}))
  }

  return <RenderedTrace
    acceptMouse={acceptMouse}
    displayed={!levelPrefs.hidden.includes(trace.id)}
    highlighted={metadata.mouseOver}
    // TODO: Add setHighlighted
    // metadata={trace.metadata}
    // setMetadata={trace.setMetadata}
    pointsArray={pointsArray}
    scale={scale}
    server={server}
    shouldDragBePrevented={shouldDragBePrevented}
    trace={trace}
    tracker={tracker}
    transform={props.transform}
  />
}
