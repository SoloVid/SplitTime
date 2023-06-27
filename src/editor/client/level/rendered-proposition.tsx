import { BodySpec } from "engine/file/collage"
import { Collage } from "engine/graphics/collage"
import { Frame } from "engine/graphics/frame"
import { Montage, frameMissingPlaceholder, makeMontage } from "engine/graphics/montage"
import { Rect } from "engine/math/rect"
import { Immutable } from "engine/utils/immutable"
import { Coordinates2D } from "engine/world/level/level-location"
import { useContext, useMemo } from "preact/hooks"
import { PLACEHOLDER_WIDTH, createSnapMontageMover, getPlaceholderImage, inGroup } from "../editor-functions"
import { ImmutableSetter, makeImmutableObjectSetterUpdater, makeStyleString, onlyLeft, preventDefault } from "../preact-help"
import { imageContext } from "../server-liaison"
import { Time } from "../time-context"
import { useScaledImageSize } from "../utils/image-size"
import { CollageManagerContext } from "./collage-manager"
import { EditorLevel, EditorPosition, EditorProp, ObjectMetadata } from "./extended-level-format"
import DraggableEntity from "./draggable-entity"
import { LevelEditorPreferencesContext } from "./level-preferences"

type RenderedPropositionProps = {
  readonly level: Immutable<EditorLevel>
  readonly entity: Immutable<EditorProp> | Immutable<EditorPosition>
  readonly entityType: "prop" | "position"
  readonly metadata: Immutable<ObjectMetadata>
  readonly setMetadata: ImmutableSetter<ObjectMetadata>
  readonly scale: number
  readonly allowDrag: boolean
}

const NOT_READY = "NOT_READY"
const NOT_AVAILABLE = "NOT_AVAILABLE"

/** Shared component for either prop or position */
export default function RenderedProposition(props: RenderedPropositionProps) {
  const {
    level,
    entity,
    scale,
    ...remainingProps
  } = props
  const p = entity
  const time = useContext(Time)
  const collageManager = useContext(CollageManagerContext)
  const [levelPrefs] = useContext(LevelEditorPreferencesContext)

  const allowInteraction = useMemo(() => inGroup(level, levelPrefs.activeGroup, entity), [level, levelPrefs.activeGroup, entity])
  const displayed = useMemo(() => !levelPrefs.hidden.includes(entity.id), [levelPrefs.hidden])

  const collage = useMemo<Immutable<Collage> | typeof NOT_READY | typeof NOT_AVAILABLE>(() => {
    if (p.collage === "" || p.montage === "") {
      return NOT_AVAILABLE
    }
    try {
      const c = collageManager.getRealCollage(p.collage)
      return c || NOT_READY
    } catch (e: unknown) {
      return NOT_AVAILABLE
    }
  }, [p.collage, collageManager])

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
    const tempMontage = makeMontage("", null, [tempFrame], tempBodySpec, [], "", 0)
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

  const frameIndex = useMemo(() => {
    return montage.getFrameIndexAt(time)
  }, [montage, time])

  const projectImages = useContext(imageContext)
  const imgSrc = useMemo(() => {
    const c = collage
    if (c === NOT_READY) {
      return ""
    }
    if (c === NOT_AVAILABLE) {
      return getPlaceholderImage()
    }
    return projectImages.imgSrc(c.image)
  }, [collage, projectImages])
  const scaledSize = useScaledImageSize(imgSrc, scale)

  const frameElements = useMemo(() => {
    const coalescedFrames = montage.frames.length > 0 ? montage.frames : [frameMissingPlaceholder]
    return coalescedFrames.map(f => <RenderedPropositionAtFrame
      level={level}
      entity={entity}
      allowInteraction={allowInteraction}
      displayed={displayed}
      montage={montage}
      frame={f}
      imgSrc={imgSrc}
      scale={scale}
      scaledSize={scaledSize}
      {...remainingProps}
    ></RenderedPropositionAtFrame>)
  }, [montage, level, entity, allowInteraction, displayed, imgSrc, scale, scaledSize, ...Object.values(remainingProps)])

  return frameElements[frameIndex ?? 0]
}

type MoreProps = {
  readonly allowInteraction: boolean
  readonly displayed: boolean
  readonly montage: Montage
  readonly frame: Frame
  readonly imgSrc: string
  readonly scaledSize: ReturnType<typeof useScaledImageSize>
}

function RenderedPropositionAtFrame(props: RenderedPropositionProps & MoreProps) {
  const {
    level,
    entity,
    entityType,
    metadata,
    setMetadata,
    allowDrag,
    allowInteraction,
    displayed,
    montage,
    frame,
    imgSrc,
    scale,
    scaledSize,
  } = props
  const p = entity
  const body = montage.bodySpec

  const framePosition = useMemo(() => {
    const box = frame.getTargetBox(body)
    box.x += p.x
    box.y += p.y - p.z
    return box
  }, [body, frame, p])

  const containerMaskStyleString = useMemo(() => {
    return makeStyleString({
      outline: metadata.mouseOver ? "2px solid yellow" : "",
      backgroundColor: metadata.mouseOver ? "yellow" : "initial",
      position: 'absolute',
      overflow: 'hidden',
      left: (framePosition.x * scale) + 'px',
      top: (framePosition.y * scale) + 'px',
      width: (frame.box.width * scale) + 'px',
      height: (frame.box.height * scale) + 'px',
      "pointer-events": allowInteraction ? "initial" : "none"
    })
    // TODO: allowInteraction = inGroup(level, levelEditorShared.activeGroup?.obj.id ?? "", p)
  }, [p, metadata, framePosition, frame, level, allowInteraction, scale])

  const imgStyleString = useMemo(() => scaledSize ? makeStyleString({
    position: "absolute",
    left: `${-frame.box.x * scale}px`,
    top: `${-frame.box.y * scale}px`,
    width: scaledSize.width + "px",
    height: scaledSize.height + "px",
  }) : { display: "none" }, [scaledSize, frame.box, scale])

  function toggleHighlight(highlight: boolean): void {
    setMetadata((before) => ({...before, mouseOver: highlight}))
  }

  return <>{displayed && <div
    className={`${entityType}`}
    onDblClick={preventDefault}
    onMouseMove={() => toggleHighlight(true)}
    onMouseLeave={() => toggleHighlight(false)}
    style={containerMaskStyleString}
  >
    <DraggableEntity
      type={entityType}
      entity={entity}
      bodySpec={montage.bodySpec}
      scale={scale}
      preventDrag={!allowDrag}
    >
      <img
        src={imgSrc}
        style={imgStyleString}
      />
    </DraggableEntity>
  </div>}</>
}
