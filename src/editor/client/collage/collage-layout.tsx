import { Frame } from "engine/file/collage"
import { useContext, useMemo, useRef } from "preact/hooks"
import GridLines from "../common/grid-lines"
import { InfoPaneContext } from "../common/info-pane"
import { imageContext } from "../common/server-liaison"
import { UserInputsContext, getRelativeMouse } from "../common/user-inputs"
import { FileCollage } from "../file-types"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { useScaledImageSize } from "../utils/image-size"
import { ImmutableSetter, onlyRight, preventDefault } from "../utils/preact-help"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import FrameRectangle from "./frame-rectangle"
import { EDITOR_PADDING, MIN_FRAME_LEN } from "./shared-types"
import { TrackFrameFunction } from "./track-frame"
import { CollageEditorControls } from "./collage-editor-shared"

type CollageLayoutProps = {
  collage: FileCollage
  controls: Pick<CollageEditorControls, "trackFrame">
  scale: number
  setCollage: ImmutableSetter<FileCollage>
}

export default function CollageLayout(props: CollageLayoutProps) {
  const {
    collage,
    controls,
    scale,
    setCollage,
  } = props

  const [globalPrefs] = useContext(GlobalEditorPreferencesContext)
  const [collagePrefs] = useContext(CollageEditorPreferencesContext)
  const editorInputs = useContext(UserInputsContext)
  const [info, setInfo] = useContext(InfoPaneContext)

  const $el = useRef<HTMLDivElement>(document.createElement("div"))
  // const $image = useRef<HTMLImageElement | null>(null)

  const mouse = useMemo(() => {
    if (editorInputs === null) {
      return { x: 0, y: 0 }
    }
    const mouseRaw = getRelativeMouse(editorInputs, $el.current)
    return {
      x: Math.round((mouseRaw.x - EDITOR_PADDING) / scale),
      y: Math.round((mouseRaw.y - EDITOR_PADDING) / scale),
    }
  }, [$el.current, editorInputs])

  // TODO: real width
  const width = 500
  const containerWidth = width + 2*EDITOR_PADDING

  // TODO: real height
  const height = 500
  const containerHeight = height + 2*EDITOR_PADDING

  const scaledGridCell = {
    x: Math.round(globalPrefs.gridCell.x * scale),
    y: Math.round(globalPrefs.gridCell.y * scale),
  }

  const framesSorted = useMemo(() => {
    const sortedFrames = collage.frames.slice()
    sortedFrames.sort((a, b) => {
      if (a.id === collagePrefs.frameSelected) {
        return 1
      }
      if (b.id === collagePrefs.frameSelected) {
        return -1
      }
      return 0
    })
    return sortedFrames
  }, [collage.frames, collagePrefs.frameSelected])

  // const framesSortedScaled = useMemo(() => {
  //   return framesSorted.map((f) => ({
  //     i: f.i,
  //     f: {
  //       ...f.f,
  //       x: f.f.x * scale,
  //       y: f.f.y * scale,
  //       width: f.f.width * scale,
  //       height: f.f.height * scale,
  //     }
  //   }))
  // }, [framesSorted, scale])

  // const viewBox = "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + containerWidth + " " + containerHeight

  const projectImages = useContext(imageContext)
  const backgroundSrc = projectImages.imgSrc(collage.image)

  // const scaledDimensions = useScaledImageDimensions($image, scale)
  const scaledSize = useScaledImageSize(backgroundSrc, scale)

  function startNewFrame(): void {
    let frameIndex = collage.frames.length
    let frameId = "f" + frameIndex
    while (collage.frames.some(f => f.id === frameId)) {
      frameIndex++
      frameId = "f" + frameIndex
    }
    const gridCell = globalPrefs.gridCell
    const newFrame: Frame = {
      id: frameId,
      name: frameId,
      x: Math.round((mouse.x) / gridCell.x) * gridCell.x,
      y: Math.round((mouse.y) / gridCell.y) * gridCell.y,
      width: MIN_FRAME_LEN,
      height: MIN_FRAME_LEN
    }
    const newFrameIndex = collage.frames.length
    setCollage((before) => ({
      ...before,
      frames: [
        ...before.frames,
        newFrame,
      ]
    }))
    if (editorInputs) {
      controls.trackFrame(editorInputs, newFrame, {x: newFrame.x + newFrame.width, y: newFrame.y + newFrame.height})
    }
  }

  function handleMouseMove(event: MouseEvent): void {
    setInfo((before) => ({
      ...before,
      x: mouse.x,
      y: mouse.y,
    }))
  }

  function handleMouseOut(event: MouseEvent): void {
    setInfo((before) => {
      const { x, y, ...restBefore } = before
      return restBefore
    })
  }

  return <div
    ref={$el}
    style="position: absolute; cursor: crosshair; display: inline-block;"
    class="transparency-checkerboard-background"
    onMouseDown={onlyRight(startNewFrame, true)}
    onContextMenu={preventDefault}
    onMouseMove={handleMouseMove}
    onMouseOut={handleMouseOut}
  >
    <div style={`padding: ${EDITOR_PADDING}px`}>
      {!!backgroundSrc && <img
        // ref={$image}
        src={backgroundSrc}
        width={scaledSize?.width}
        height={scaledSize?.height}
        // style={`width: ${scaledDimensions.x}px; height: ${scaledDimensions.y}px;`}
      />}
    </div>
    <svg
      style="position:absolute; left: 0; top: 0; width: 100%; height: 100%"
    >
      {framesSorted.map((frame) => (
        <FrameRectangle
          collage={collage}
          controls={controls}
          key={frame.id}
          frame={frame}
          offset={{x: EDITOR_PADDING, y: EDITOR_PADDING}}
          scale={scale}
          setCollage={setCollage}
        />
      ))}
    </svg>
    {globalPrefs.gridEnabled && <GridLines
      gridCell={scaledGridCell}
      origin={{x: EDITOR_PADDING, y: EDITOR_PADDING}}
    />}
  </div>
}