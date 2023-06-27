import { Immutable } from "engine/utils/immutable"
import { generateUID } from "engine/utils/misc"
import { Coordinates2D, Coordinates3D } from "engine/world/level/level-location"
import { makePositionPoint } from "engine/world/level/trace/trace-points"
import { TraceType } from "engine/world/level/trace/trace-type"
import { assert } from "globals"
import { useContext, useMemo, useRef, useState } from "preact/hooks"
import { createSnapMontageMover, findClosestPosition, getGroupById, makeNewTrace } from "../editor-functions"
import GridLines from "../grid-lines"
import { InfoPaneContext } from "../info-pane"
import { ImmutableSetter, makeStyleString, preventDefault } from "../preact-help"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { GlobalEditorShared } from "../shared-types"
import { UserInputsContext } from "../user-inputs"
import { CollageManagerContext } from "./collage-manager"
import { useEntityBodies } from "./entity-body-manager"
import { useSortedEntities } from "./entity-sort-helper"
import { EditorLevel, EditorPosition, EditorProp, EditorTrace, ObjectMetadataMap, blankObjectMetadata } from "./extended-level-format"
import LevelBackground from "./level-background"
import { LevelEditorPreferencesContext } from "./level-preferences"
import RenderedLevelTrace from "./rendered-level-trace"
import RenderedProposition from "./rendered-proposition"
import { EDITOR_PADDING } from "./shared-types"
import RenderCounter from "../utils/render-counter"
import { useArrayMemo } from "../utils/use-array-memo"

type LevelGraphicalEditorProps = {
  globalStuff: GlobalEditorShared
  level: Immutable<EditorLevel>
  setLevel: ImmutableSetter<EditorLevel>
  objectMetadataMap: Immutable<ObjectMetadataMap>
  setObjectMetadataMap: ImmutableSetter<ObjectMetadataMap>
  scale: number
}

export default function LevelGraphicalEditor(props: LevelGraphicalEditorProps) {
  const {
    globalStuff,
    level, setLevel,
    objectMetadataMap, setObjectMetadataMap,
    scale,
  } = props

  const [globalPrefs, setGlobalPrefs] = useContext(GlobalEditorPreferencesContext)
  const [levelPrefs, setLevelPrefs] = useContext(LevelEditorPreferencesContext)
  const editorInputs = useContext(UserInputsContext)
  assert(editorInputs !== null, "editorInputs should not be null")
  const collageManager = useContext(CollageManagerContext)
  const [infoPane, setInfoPane] = useContext(InfoPaneContext)

  const [pathInProgress, setPathInProgress] = useState<Immutable<EditorTrace> | null>(null)

  const editorPadding = EDITOR_PADDING

  const $el = useRef<HTMLDivElement>(null)

  // const allEntities = [...level.props, ...level.positions, ...level.traces]
  const allEntities = useMemo(
    () => [
      ...level.props.map(e => ({t: "prop", e} as const)),
      ...level.positions.map(e => ({t: "position", e} as const)),
      ...level.traces.map(e => ({t: "trace", e} as const)),
    ],
    [level.props, level.positions, level.traces]
  )
  const allEntitiesJustEntities = useMemo(() => allEntities.map(e => e.e), [allEntities])
  const entityBodies = useEntityBodies(level, collageManager, allEntitiesJustEntities)
  const allEntitiesSorted = useSortedEntities(allEntities, entityBodies)
  // This is the workaround if the sorting hangs up the UI too much.
  // const allEntitiesSorted = allEntities

  const inputs = useMemo(() => {
    console.log("rebuilding inputs")
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
    return level.groups.length > 0 ? level.groups[level.groups.length - 1].defaultZ : 0
  }, [level.groups])
  const containerHeight = ((level.height + addedHeight) * scale) + 2*EDITOR_PADDING

  const levelOffsetStyle = makeStyleString({
    position: 'absolute',
    left: EDITOR_PADDING + 'px',
    top: EDITOR_PADDING + 'px'
  })

  const traceTransform = "translate(" + EDITOR_PADDING + "," + EDITOR_PADDING + ")"

  const scaledGridCell = {
    x: Math.round(globalPrefs.gridCell.x * scale),
    y: Math.round(globalPrefs.gridCell.y * scale),
  }

  function getActiveFileGroup() {
    return getGroupById(level, levelPrefs.activeGroup ?? "")
  }

  function getBestEntityLocation(): Coordinates3D {
    const group = getActiveFileGroup()
    var z = group.defaultZ
    var x = inputs.mouse.x
    var y = inputs.mouse.y + z
    
    const mId = levelPrefs.montageSelected
    const selectedCollage = levelPrefs.collageSelected ? collageManager.getCollage(levelPrefs.collageSelected) : null
    const m = selectedCollage?.montages.find((m) => m.id === mId)
    if (!m) {
      return new Coordinates3D(x, y, z)
    }
    const LARGE_NUMBER = 999
    const start = new Coordinates2D(-LARGE_NUMBER, -LARGE_NUMBER)
    const dx = x - start.x
    const dy = y - start.y
    const snappedMover = createSnapMontageMover(globalPrefs.gridCell, m.body, start)
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
    let name = "Position " + pIndex
    while (level.positions.some(p => p.name === name)) {
      pIndex++
      name = "Position " + pIndex
    }
    const newThing: EditorPosition = {
      id: generateUID(),
      name: name,
      group: group.id,
      collage: levelPrefs.collageSelected ?? "",
      montage: levelPrefs.montageSelected ?? "",
      x: loc.x,
      y: loc.y,
      z: loc.z,
      dir: levelPrefs.montageDirectionSelected ?? "",
    }

    setLevel((before) => ({...before, positions: [...before.positions, newThing]}))
    setLevelPrefs((before) => ({...before, propertiesPanel: {type: "position", id: newThing.id}}))
    // TODO: Lookup will fail because state hasn't propagated?
    // levelEditorShared.setPropertiesPanel(newEntity)
  }
  
  function createProp() {
    const group = getActiveFileGroup()
    const loc = getBestEntityLocation()
    
    const newThing: EditorProp = {
      id: generateUID(),
      // FTODO: Generate ID from montage name
      name: "",
      group: group.id,
      collage: levelPrefs.collageSelected ?? "",
      montage: levelPrefs.montageSelected ?? "",
      x: loc.x,
      y: loc.y,
      z: loc.z,
      dir: levelPrefs.montageDirectionSelected ?? "",
    }

    setLevel((before) => ({...before, props: [...before.props, newThing]}))
    setLevelPrefs((before) => ({...before, propertiesPanel: {type: "prop", id: newThing.id}}))
    // TODO: Lookup will fail because state hasn't propagated?
    // levelEditorShared.setPropertiesPanel(newEntity)
  }

  function handleMouseUp(event: MouseEvent): void {
    const group = getActiveFileGroup()
    const z = group.defaultZ
    const yInGroup = inputs.mouse.y + z
    const x = inputs.mouse.x
    const isLeftClick = event.button === 0
    const isRightClick = event.button === 2
    const gridCell = globalPrefs.gridCell
    if(levelPrefs.mode === "trace") {
      const snappedX = Math.round(x / gridCell.x) * gridCell.x
      const snappedY = Math.round(yInGroup / gridCell.y) * gridCell.y
      var literalPoint = "(" +
        Math.floor(snappedX) + ", " +
        Math.floor(snappedY) + ")"
      var closestPosition = findClosestPosition(level, inputs.mouse.x, yInGroup)
      var positionPoint = closestPosition ? makePositionPoint(closestPosition.id) : ""
      function addPathInProgressVertex(newVertex: string) {
        setPathInProgress((before) => {
          if (before === null) {
            // FTODO: Handle this better?
            return null
          }
          return {
            ...before,
            vertices: before.vertices + " " + newVertex,
          }
        })
      }
      if(isLeftClick) {
        if(pathInProgress) {
          if(levelPrefs.traceType == "path" && inputs.ctrlDown) {
            addPathInProgressVertex(positionPoint)
          } else {
            addPathInProgressVertex(literalPoint)
          }
        }
      } else if(isRightClick) {
        if(!pathInProgress) {
          const trace = makeNewTrace(level, getActiveFileGroup().id, levelPrefs.traceType)
          
          if(levelPrefs.traceType == TraceType.PATH && !inputs.ctrlDown) {
            trace.vertices = positionPoint
          } else {
            trace.vertices = literalPoint
          }

          setLevel((before) => ({...before, traces: [...before.traces, trace]}))
          setLevelPrefs((before) => ({...before, propertiesPanel: {type: "trace", id: trace.id}}))
          // TODO: Lookup will fail because state hasn't propagated?
          // levelEditorShared.setPropertiesPanel(newEntity)
          setPathInProgress(trace)
        } else {
          if(!inputs.ctrlDown) {
            if(pathInProgress.type == TraceType.PATH) {
              if(closestPosition) {
                addPathInProgressVertex(positionPoint)
              }
            }
            else {
              addPathInProgressVertex("(close)")
            }
          }
          setPathInProgress(null)
        }
      }
    } else if(levelPrefs.mode === "position") {
      if(isRightClick) {
        createPosition()
      }
    } else if(levelPrefs.mode === "prop") {
      if(isRightClick) {
        createProp()
      }
    }
  }

  function handleMouseMove(event: MouseEvent): void {
    const group = getActiveFileGroup()
    const groupZ = group ? group.defaultZ : 0
    setInfoPane((before) => ({
      ...before,
      x: inputs.mouse.x,
      y: inputs.mouse.y + groupZ,
      z: groupZ,
    }))
  }

  const entityDataForElements = allEntitiesSorted

  const entityElements = useArrayMemo(
    entityDataForElements,
    ["e", "id"],
    (entity) => (
      <div
        key={entity.e.id}
        className="entity"
      >
        {entity.t !== "trace" && <div
          className="proposition-container"
          style={levelOffsetStyle}
        >
          <RenderedProposition
            level={level}
            entityType={entity.t}
            entity={entity.e}
            metadata={objectMetadataMap[entity.e.id] ?? blankObjectMetadata}
            setObjectMetadataMap={setObjectMetadataMap}
            scale={scale}
            allowDrag={false} // TODO: Source allowDrag value correctly.
          />
        </div>}
        {entity.t === "trace" && <svg
          style={`position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;`}
          className="trace-svg"
        >
          <RenderedLevelTrace
            level={level}
            metadata={objectMetadataMap[entity.e.id] ?? blankObjectMetadata}
            scale={scale}
            server={globalStuff.server}
            shouldDragBePrevented={true} // TODO: Source allowDrag value correctly.
            transform={traceTransform}
            trace={entity.e}
          />
        </svg>}
      </div>
    ),
    [levelOffsetStyle, level, objectMetadataMap, setObjectMetadataMap, scale, globalStuff.server, traceTransform]
  )

  return <div
    ref={$el}
    className="level-area transparency-checkerboard-background"
    style={`position: relative; width: ${containerWidth}px; height: ${containerHeight}px; overflow: hidden`}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onContextMenu={preventDefault}
    onDblClick={preventDefault}
    onDragStart={preventDefault}
  >
    <RenderCounter debugLabel="LevelGraphicalEditor"></RenderCounter>
    <LevelBackground level={level} scale={scale} />

    {entityElements}

    {globalPrefs.gridEnabled && <GridLines
      gridCell={scaledGridCell}
      origin={{x: editorPadding, y: editorPadding}}
    />}
  </div>
}