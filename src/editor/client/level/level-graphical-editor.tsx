import { Coordinates2D, Coordinates3D } from "engine/world/level/level-location"
import { TraceType } from "engine/world/level/trace/trace-type"
import { makePositionPoint } from "engine/world/level/trace/trace-points"
import { useMemo, useRef } from "preact/hooks"
import { createSnapMontageMover, findClosestPosition, getGroupById, makeNewTrace } from "../editor-functions"
import GridLines from "../grid-lines"
import { ImmutableSetter, makeStyleString, preventDefault } from "../preact-help"
import { UserInputs } from "../shared-types"
import LevelBackground from "./level-background"
import { useEntityBodies } from "./entity-body-manager"
import { useSortedEntities } from "./entity-sort-helper"
import { SharedStuff } from "./level-editor-shared"
import RenderedLevelTrace from "./rendered-level-trace"
import RenderedProposition from "./rendered-proposition"
import { EDITOR_PADDING } from "./shared-types"

type LevelGraphicalEditorProps = {
  levelEditorShared: SharedStuff
}

export default function LevelGraphicalEditor(props: LevelGraphicalEditorProps) {
  const {
    levelEditorShared,
  } = props

  const scale = levelEditorShared.globalStuff.scale
  const editorInputs = levelEditorShared.globalStuff.userInputs
  const editorPadding = EDITOR_PADDING
  const level = levelEditorShared.level

  const $el = useRef<HTMLDivElement>(null)

  // const allEntities = [...level.props, ...level.positions, ...level.traces]
  const allEntities = useMemo(
    () => [...level.props, ...level.positions, ...level.traces],
    [level.props, level.positions, level.traces]
  )
  const entityBodies = useEntityBodies(level, levelEditorShared.collageManager, allEntities)
  const allEntitiesSorted = useSortedEntities(allEntities, entityBodies)
  // This is the workaround if the sorting hangs up the UI too much.
  // const allEntitiesSorted = allEntities

  const inputs = useMemo<UserInputs>(() => {
    let position = {
      x: 0,
      y: 0
    }
    if ($el.current) {
      position = {
        x: $el.current.offsetLeft - $el.current.parentElement!.scrollLeft,
        y: $el.current.offsetTop - $el.current.parentElement!.scrollTop
      }
    }
    const mouse = {
      x: Math.round((editorInputs.mouse.x - position.x - EDITOR_PADDING) / scale),
      y: Math.round((editorInputs.mouse.y - position.y - EDITOR_PADDING) / scale),
      // FTODO: only is down when inside level editor
      isDown: editorInputs.mouse.isDown
    }
    return {
      mouse,
      ctrlDown: editorInputs.ctrlDown
    }
  }, [$el.current, editorInputs])

  const containerWidth = (level.width * scale) + 2*EDITOR_PADDING
  const addedHeight = useMemo(() => {
    return level.groups.length > 0 ? level.groups[level.groups.length - 1].obj.defaultZ : 0
  }, [level.groups])
  const containerHeight = ((level.height + addedHeight) * scale) + 2*EDITOR_PADDING

  const levelOffsetStyle = makeStyleString({
    position: 'absolute',
    left: EDITOR_PADDING + 'px',
    top: EDITOR_PADDING + 'px'
  })

  const traceTransform = "translate(" + EDITOR_PADDING + "," + EDITOR_PADDING + ")"

  const scaledGridCell = {
    x: Math.round(levelEditorShared.globalStuff.gridCell.x * scale),
    y: Math.round(levelEditorShared.globalStuff.gridCell.y * scale),
  }

  function getActiveFileGroup() {
    return getGroupById(level, levelEditorShared.activeGroup?.obj.id ?? "")
  }

  function getBestEntityLocation(): Coordinates3D {
    const group = getActiveFileGroup()
    var z = group.defaultZ
    var x = inputs.mouse.x
    var y = inputs.mouse.y + z
    
    const mId = levelEditorShared.selectedMontage
    const m = levelEditorShared.selectedCollage?.montages.find((m) => m.id === mId)
    if (!m) {
      return new Coordinates3D(x, y, z)
    }
    const LARGE_NUMBER = 999
    const start = new Coordinates2D(-LARGE_NUMBER, -LARGE_NUMBER)
    const dx = x - start.x
    const dy = y - start.y
    const snappedMover = createSnapMontageMover(levelEditorShared.globalStuff.gridCell, m.body, start)
    snappedMover.applyDelta(dx, dy)
    const snapped = snappedMover.getSnappedDelta()
    snapped.x += start.x
    snapped.y += start.y
    return new Coordinates3D(snapped.x, snapped.y, z)
  }

  function createPosition() {
    const group = getActiveFileGroup()
    const loc = getBestEntityLocation()

    let pIndex = level.positions.length
    let pId = "Position " + pIndex
    while (level.positions.some(m => m.obj.id === pId)) {
      pIndex++
      pId = "Position " + pIndex
    }
    const newThing = {
      id: pId,
      group: group.id,
      collage: levelEditorShared.selectedCollageId ?? "",
      montage: levelEditorShared.selectedMontage ?? "",
      x: loc.x,
      y: loc.y,
      z: loc.z,
      dir: levelEditorShared.selectedMontageDirection ?? "",
    }

    const newEntity = levelEditorShared.level.addPosition(newThing)
    // TODO: Lookup will fail because state hasn't propagated?
    levelEditorShared.setPropertiesPanel(newEntity)
  }
  
  function createProp() {
    const group = getActiveFileGroup()
    const loc = getBestEntityLocation()
    
    const newThing = {
      // FTODO: Generate ID from montage name
      id: "",
      group: group.id,
      collage: levelEditorShared.selectedCollageId ?? "",
      montage: levelEditorShared.selectedMontage ?? "",
      x: loc.x,
      y: loc.y,
      z: loc.z,
      dir: levelEditorShared.selectedMontageDirection ?? "",
    }

    const newEntity = levelEditorShared.level.addProp(newThing)
    // TODO: Lookup will fail because state hasn't propagated?
    levelEditorShared.setPropertiesPanel(newEntity)
  }

  function handleMouseUp(event: MouseEvent): void {
    const group = getActiveFileGroup()
    const z = group.defaultZ
    const yInGroup = inputs.mouse.y + z
    const x = inputs.mouse.x
    const isLeftClick = event.button === 0
    const isRightClick = event.button === 2
    const gridCell = levelEditorShared.globalStuff.gridCell
    if(levelEditorShared.mode === "trace") {
      const snappedX = Math.round(x / gridCell.x) * gridCell.x
      const snappedY = Math.round(yInGroup / gridCell.y) * gridCell.y
      var literalPoint = "(" +
        Math.floor(snappedX) + ", " +
        Math.floor(snappedY) + ")"
      var closestPosition = findClosestPosition(level, inputs.mouse.x, yInGroup)
      var positionPoint = closestPosition ? makePositionPoint(closestPosition.obj.id) : ""
      const pathInProgress = levelEditorShared.pathInProgress
      function addPathInProgressVertex(newVertex: string) {
        pathInProgress?.setObj((before) => ({
          ...before,
          vertices: before.vertices + " " + newVertex,
        }))
      }
      if(isLeftClick) {
        if(pathInProgress) {
          if(levelEditorShared.selectedTraceType == "path" && inputs.ctrlDown) {
            addPathInProgressVertex(positionPoint)
          } else {
            addPathInProgressVertex(literalPoint)
          }
        }
      } else if(isRightClick) {
        if(!pathInProgress) {
          const trace = makeNewTrace(level, getActiveFileGroup().id, levelEditorShared.selectedTraceType)
          
          if(levelEditorShared.selectedTraceType == TraceType.PATH && !inputs.ctrlDown) {
            trace.vertices = positionPoint
          } else {
            trace.vertices = literalPoint
          }

          const newEntity = levelEditorShared.level.addTrace(trace)
          // TODO: Lookup will fail because state hasn't propagated?
          levelEditorShared.setPropertiesPanel(newEntity)
          levelEditorShared.setPathInProgress(newEntity)
        } else {
          if(!inputs.ctrlDown) {
            if(pathInProgress.obj.type == TraceType.PATH) {
              if(closestPosition) {
                addPathInProgressVertex(positionPoint)
              }
            }
            else {
              addPathInProgressVertex("(close)")
            }
          }
          levelEditorShared.setPathInProgress(null)
        }
      }
    } else if(levelEditorShared.mode === "position") {
      if(isRightClick) {
        createPosition()
      }
    } else if(levelEditorShared.mode === "prop") {
      if(isRightClick) {
        createProp()
      }
    }
  }

  function handleMouseMove(event: MouseEvent): void {
    const group = getActiveFileGroup()
    const groupZ = group ? group.defaultZ : 0
    levelEditorShared.setInfo({
      ...levelEditorShared.info,
      x: inputs.mouse.x,
      y: inputs.mouse.y + groupZ,
      z: groupZ,
    })
  }

  return <div
    ref={$el}
    className="level-area"
    style={`position: relative; width: ${containerWidth}px; height: ${containerHeight}px; overflow: hidden`}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onContextMenu={preventDefault}
    onDblClick={preventDefault}
    onDragStart={preventDefault}
  >
    <LevelBackground level={level} scale={scale} />

    {allEntitiesSorted.map((entity) => (
    <div
      key={entity.metadata.editorId}
      className="entity"
    >
      {(entity.type === "prop" || entity.type === "position") && <div
        className="proposition-container"
        style={levelOffsetStyle}
      >
        <RenderedProposition
          levelEditorShared={levelEditorShared}
          entity={entity}
        />
      </div>}
      {entity.type === "trace" && <svg
        style={`position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;`}
        className="trace-svg"
      >
        <RenderedLevelTrace
          transform={traceTransform}
          levelEditorShared={levelEditorShared}
          trace={entity}
        />
      </svg>}
    </div>
    ))}

    {levelEditorShared.globalStuff.gridEnabled && <GridLines
      gridCell={scaledGridCell}
      origin={{x: editorPadding, y: editorPadding}}
    />}
  </div>
}