import { BodySpec } from "engine/file/collage"
import { Collage } from "engine/graphics/collage"
import { Frame } from "engine/graphics/frame"
import { Montage } from "engine/graphics/montage"
import { Rect } from "engine/math/rect"
import { Immutable } from "engine/utils/immutable"
import { Coordinates2D } from "engine/world/level/level-location"
import { useMemo } from "preact/hooks"
import { createSnapMontageMover, getPlaceholderImage, inGroup, PLACEHOLDER_WIDTH } from "../editor-functions"
import { makeImmutableObjectSetterUpdater, onlyLeft, preventDefault } from "../preact-help"
import { EditorPositionEntity, EditorPropEntity } from "./extended-level-format"
import { SharedStuff } from "./level-editor-shared"

type RenderedPropositionProps = {
  readonly levelEditorShared: SharedStuff
  readonly entity: Immutable<EditorPropEntity> | Immutable<EditorPositionEntity>
}

const NOT_READY = "NOT_READY"
const NOT_AVAILABLE = "NOT_AVAILABLE"

/** Shared component for either prop or position */
export default function RenderedProposition(props: RenderedPropositionProps) {
  const {
    levelEditorShared,
    entity,
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
    const originalX = entity.obj.x
    const originalY = entity.obj.y
    levelEditorShared.follow({
      shift: (dx, dy) => {
        snappedMover.applyDelta(dx, dy)
        const snappedDelta = snappedMover.getSnappedDelta()
        updateP((before) => ({
          x: originalX + snappedDelta.x,
          y: originalY + snappedDelta.y,
        }))
      }
    })
    levelEditorShared.setPropertiesPanel(entity)
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
