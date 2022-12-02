import { BodySpec } from "engine/file/collage"
import { Collage } from "engine/graphics/collage"
import { Frame } from "engine/graphics/frame"
import { Montage } from "engine/graphics/montage"
import { Rect } from "engine/math/rect"
import { Immutable } from "engine/utils/immutable"
import { Coordinates2D } from "engine/world/level/level-location"
import { useMemo } from "preact/hooks"
import { createSnapMontageMover, getPlaceholderImage, inGroup, PLACEHOLDER_WIDTH } from "../editor-functions"
import { FilePosition, FileProp } from "../file-types"
import { ImmutableSetter, makeImmutableObjectSetterUpdater, onlyLeft, preventDefault } from "../preact-help"
import { EditorMetadata } from "../shared-types"
import { EditorPositionEntity, EditorPropEntity } from "./extended-level-format"
import { SharedStuff } from "./level-editor-shared"

type RenderedPropositionProps = {
  readonly levelEditorShared: SharedStuff
  readonly entity: Immutable<EditorPropEntity> | Immutable<EditorPositionEntity>
  // readonly p: Immutable<FileProp | FilePosition>
  // readonly setP: ImmutableSetter<FileProp | FilePosition>
  // readonly entityType: "prop" | "position"
  // readonly entityIndex: number
  // readonly metadata: Immutable<EditorMetadata>
  // readonly setMetadata: ImmutableSetter<EditorMetadata>
}

const NOT_READY = "NOT_READY"
const NOT_AVAILABLE = "NOT_AVAILABLE"

/** Shared component for either prop or position */
export default function RenderedProposition(props: RenderedPropositionProps) {
  const {
    levelEditorShared,
    entity,
    // setP,
    // entityType,
    // entityIndex,
    // metadata,
    // setMetadata,
  } = props
  const p = entity.obj
  const metadata = entity.metadata
  const time = levelEditorShared.globalStuff.time
  const level = levelEditorShared.level
  const updateP = makeImmutableObjectSetterUpdater(entity.setObj)
  const updateMetadata = makeImmutableObjectSetterUpdater(entity.setMetadata)

  const collage = useMemo<Immutable<Collage> | typeof NOT_READY | typeof NOT_AVAILABLE>(() => {
    if (p.collage === "") {
      return NOT_AVAILABLE
    }
    try {
      const c = levelEditorShared.collageManager.getRealCollage(p.collage)
      return c || NOT_READY
    } catch (e: unknown) {
      return NOT_AVAILABLE
    }
  }, [p.collage, levelEditorShared.collageManager])

  const montage = useMemo(() => {
    const tempFrame = new Frame(
      Rect.make(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH),
      new Coordinates2D(),
      1
    )
    const tempBodySpec: BodySpec = {
      width: 32,
      depth: 32,
      height: 32
    }
    const tempMontage = new Montage("", null, [tempFrame], tempBodySpec, [], "", 0)
    if (collage === NOT_READY || collage == NOT_AVAILABLE) {
      return tempMontage
    }
    try {
      if (p.montage === "") {
        return collage.getDefaultMontage(p.dir)
      }
      return collage.getMontage(p.montage, p.dir)
    } catch (e: unknown) {
      return tempMontage
    }
  }, [collage, p.montage, p.dir])
  
  const body = montage.bodySpec

  const frame = useMemo(() => {
    return montage.getFrameAt(time)
  }, [montage, time])

  const framePosition = useMemo(() => {
    const box = frame.getTargetBox(body)
    box.x += p.x
    box.y += p.y - p.z
    return box
  }, [body, frame, p])

  const positionLeft = useMemo(() => framePosition.x, [framePosition])
  const positionTop = useMemo(() => framePosition.y, [framePosition])

  const styleString = useMemo(() => {
    return {
      outline: metadata.highlighted ? "2px solid yellow" : "",
      backgroundColor: metadata.highlighted ? "yellow" : "initial",
      position: 'absolute',
      overflow: 'hidden',
      left: positionLeft + 'px',
      top: positionTop + 'px',
      width: frame.box.width + 'px',
      height: frame.box.height + 'px',
      "pointer-events": inGroup(level, levelEditorShared.activeGroup?.obj.id ?? "", p) ? "initial" : "none"
    }
  }, [p, metadata, positionLeft, positionTop, frame, level, levelEditorShared.activeGroup])

  const imgSrc = useMemo(() => {
    const c = collage
    if (c === NOT_READY) {
      return ""
    }
    if (c === NOT_AVAILABLE) {
      return getPlaceholderImage()
    }
    return levelEditorShared.globalStuff.server.imgSrc(c.image)
  }, [collage, levelEditorShared.globalStuff.server])

  function toggleHighlight(highlight: boolean): void {
    if(levelEditorShared.shouldDragBePrevented()) {
      updateMetadata({highlighted: false})
      return
    }
    updateMetadata({highlighted: highlight})
  }

  function track(): void {
    if(levelEditorShared.shouldDragBePrevented()) {
      return
    }
    const snappedMover = createSnapMontageMover(levelEditorShared.globalStuff.gridCell, montage.bodySpec, p)
    levelEditorShared.follow({
      shift: (dx, dy) => {
        snappedMover.applyDelta(dx, dy)
        const snappedDelta = snappedMover.getSnappedDelta()
        updateP((before) => ({
          x: before.x + snappedDelta.x,
          y: before.y + snappedDelta.y,
        }))
      }
    })
    levelEditorShared.setPropertiesPanel(entity)
    // if (entityType === "prop") {
    //   levelEditorShared.setPropertiesPath(["props", entityIndex])
    // } else {
    //   levelEditorShared.setPropertiesPath(["positions", entityIndex])
    // }
  }

  return <>{metadata.displayed && <div
    className={`draggable ${entity.type}`}
    onDblClick={preventDefault}
    onMouseDown={onlyLeft(track)}
    onMouseMove={() => toggleHighlight(true)}
    onMouseLeave={() => toggleHighlight(false)}
    style={styleString}
  >
    <img
      src={imgSrc}
      style={`position: absolute; left: ${-frame.box.x}px; top: ${-frame.box.y}px`}
    />
  </div>}</>
}
