import { Frame } from "engine/file/collage"
import { useContext, useMemo, useRef } from "preact/hooks"
import GridLines from "../grid-lines"
import { onlyRight, preventDefault } from "../preact-help"
import { imageContext } from "../server-liaison"
import { getRelativeMouse, UserInputs } from "../shared-types"
import { SharedStuff } from "./collage-editor-shared"
import FrameRectangle from "./frame-rectangle"
import { EDITOR_PADDING, MIN_FRAME_LEN } from "./shared-types"

type CollageLayoutProps = {
  collageEditorShared: SharedStuff
}

export default function CollageLayout(props: CollageLayoutProps) {
  const {
    collageEditorShared
  } = props

  const collage = collageEditorShared.collage
  const scale = collageEditorShared.globalStuff.scale

  const $el = useRef<HTMLDivElement>(document.createElement("div"))
  const $image = useRef<HTMLImageElement | null>(null)

  const editorInputs = collageEditorShared.globalStuff.userInputs
  const mouse = useMemo(() => {
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
    x: Math.round(collageEditorShared.globalStuff.gridCell.x * scale),
    y: Math.round(collageEditorShared.globalStuff.gridCell.y * scale),
  }

  const framesSorted = useMemo(() => {
    const framesWithIndices = collage.frames.map((f, i) => ({ f, i }))
    framesWithIndices.sort((a, b) => {
      if (a.f === collageEditorShared.selectedFrame) {
        return 1
      }
      if (b.f === collageEditorShared.selectedFrame) {
        return -1
      }
      return 0
    })
    return framesWithIndices
  }, [collage.frames, collageEditorShared.selectedFrame])

  const framesSortedScaled = useMemo(() => {
    return framesSorted.map((f) => ({
      i: f.i,
      f: {
        ...f.f,
        x: f.f.x * scale,
        y: f.f.y * scale,
        width: f.f.width * scale,
        height: f.f.height * scale,
      }
    }))
  }, [framesSorted, scale])

  const viewBox = "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + containerWidth + " " + containerHeight

  const projectImages = useContext(imageContext)
  const backgroundSrc = projectImages.imgSrc(collage.image)

  const imageDimensions = useMemo(() => {
    if (!$image.current) {
      return { x: 32, y: 32 }
    }
    return {
      x: $image.current.naturalWidth,
      y: $image.current.naturalHeight,
    }
  }, [$image.current])

  const scaledDimensions = useMemo(() => {
    return {
      x: Math.round(imageDimensions.x * scale),
      y: Math.round(imageDimensions.y * scale),
    }
  }, [imageDimensions.x, imageDimensions.y, scale])

  function startNewFrame(): void {
    let frameIndex = collage.frames.length
    let frameId = "Frame " + frameIndex
    while (collage.frames.some(f => f.id === frameId)) {
      frameIndex++
      frameId = "Frame " + frameIndex
    }
    const gridCell = collageEditorShared.globalStuff.gridCell
    const newFrame: Frame = {
      id: frameId,
      x: Math.round((mouse.x) / gridCell.x) * gridCell.x,
      y: Math.round((mouse.y) / gridCell.y) * gridCell.y,
      width: MIN_FRAME_LEN,
      height: MIN_FRAME_LEN
    }
    const newFrameIndex = collage.frames.length
    collageEditorShared.setCollage((before) => ({
      ...before,
      frames: [
        ...before.frames,
        newFrame,
      ]
    }))
    collageEditorShared.trackFrame(newFrameIndex, newFrame, {x: newFrame.x + newFrame.width, y: newFrame.y + newFrame.height})
  }

  function handleMouseMove(event: MouseEvent): void {
    collageEditorShared.setInfo((before) => ({
      ...before,
      x: mouse.x,
      y: mouse.y,
    }))
  }

  function handleMouseOut(event: MouseEvent): void {
    collageEditorShared.setInfo((before) => {
      const { x, y, ...restBefore } = before
      return restBefore
    })
  }

  return <div
    ref={$el}
    style="position: relative; cursor: crosshair; display: inline-block;"
    class="transparency-checkerboard-background"
    onMouseDown={onlyRight(startNewFrame, true)}
    onContextMenu={preventDefault}
    onMouseMove={handleMouseMove}
    onMouseOut={handleMouseOut}
  >
    <div style={`padding: ${EDITOR_PADDING}px`}>
      {!!backgroundSrc && <img
        ref={$image}
        src={backgroundSrc}
        style={`width: ${scaledDimensions.x}px; height: ${scaledDimensions.y}px;`}
      />}
    </div>
    <svg
      style="position:absolute; left: 0; top: 0; width: 100%; height: 100%"
    >
      {framesSorted.map((frame) => (
        <FrameRectangle
          key={frame.f.id}
          collageEditorShared={collageEditorShared}
          frameIndex={frame.i}
          frame={frame.f}
          offset={{x: EDITOR_PADDING, y: EDITOR_PADDING}}
          scale={scale}
        />
      ))}
    </svg>
    {collageEditorShared.globalStuff.gridEnabled && <GridLines
      gridCell={scaledGridCell}
      origin={{x: EDITOR_PADDING, y: EDITOR_PADDING}}
    />}
  </div>
}