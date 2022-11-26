import { Frame } from "engine/file/collage"
import { useMemo, useRef } from "preact/hooks"
import { getRelativeMouse } from "../shared-types"
import { SharedStuff } from "./collage-editor-shared"
import FrameRectangle from "./frame-rectangle"
import { EDITOR_PADDING, MIN_FRAME_LEN } from "./shared-types"

type CollageLayoutProps = {
  collageEditorShared: SharedStuff
}

export default function CollageLayout(props: CollageLayoutProps) {
  // interface VueCollageLayout extends client.VueComponent {
  //   // props
  //   editorInputs: client.UserInputs
  //   collageEditorShared: CollageEditorShared
  //   // data
  //   editorPadding: number
  //   // computed
  //   backgroundSrc: string
  //   collage: file.Collage
  //   containerWidth: number
  //   containerHeight: number
  //   framesSorted: file.collage.Frame[]
  //   viewBox: string
  //   // asyncComputed
  //   // methods
  //   // handleKeyDown(event: KeyboardEvent): void
  //   startNewFrame(): void
  // }

  const {
    collageEditorShared
  } = props

  const collage = collageEditorShared.collage

  // TODO: real width
  const width = 500
  const containerWidth = width + 2*EDITOR_PADDING

  // TODO: real height
  const height = 500
  const containerHeight = height + 2*EDITOR_PADDING

  const framesSorted = useMemo(() => {
    const frameArrayCopy = collage.frames.slice()
    frameArrayCopy.sort((a, b) => {
      if (a === collageEditorShared.selectedFrame) {
        return 1
      }
      if (b === collageEditorShared.selectedFrame) {
        return -1
      }
      return 0
    })
    return frameArrayCopy
  }, [collage.frames, collageEditorShared.selectedFrame])

  const viewBox = "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + containerWidth + " " + containerHeight

  // TODO: Make sure this is reactive.
  const backgroundSrc = collageEditorShared.globalStuff.server.imgSrc(collage.image)

  const $el = useRef<HTMLDivElement>(document.createElement("div"))

  function startNewFrame(): void {
    const mouse = getRelativeMouse(collageEditorShared.globalStuff.userInputs, $el.current)
    let frameIndex = collage.frames.length
    let frameId = "Frame " + frameIndex
    while (collage.frames.some(f => f.id === frameId)) {
      frameIndex++
      frameId = "Frame " + frameIndex
    }
    const gridCell = collageEditorShared.globalStuff.gridCell
    const newFrame: Frame = {
      id: frameId,
      x: Math.round((mouse.x - EDITOR_PADDING) / gridCell.x) * gridCell.x,
      y: Math.round((mouse.y - EDITOR_PADDING) / gridCell.y) * gridCell.y,
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
    collageEditorShared.trackFrame(newFrameIndex, {x: newFrame.x + newFrame.width, y: newFrame.y + newFrame.height})
  }

  return <div
    ref={$el}
    style="position: relative; cursor: crosshair; display: inline-block;"
    class="transparency-checkerboard-background"
    onMouseDown={(e) => { if (e.button === 3) { startNewFrame(); e.preventDefault() }}}
    onContextMenu={(e) => e.preventDefault()}
  >
    <div style={`padding: ${EDITOR_PADDING}px`}>
      {!!backgroundSrc && <img
        src={backgroundSrc}
      />}
    </div>
    <svg
      style="position:absolute; left: 0; top: 0; width: 100%; height: 100%"
    >
      {framesSorted.map((frame, i) => (
        <FrameRectangle
          key={frame.id}
          collageEditorShared={collageEditorShared}
          frameIndex={i}
          frame={frame}
          offset={{x: EDITOR_PADDING, y: EDITOR_PADDING}}
        />
      ))}
      {/* <frame-rectangle v-for="frame in framesSorted"
        :key="frame.id"
        :collage-editor-shared="collageEditorShared"
        :frame="frame"
        :offset="{x: editorPadding, y: editorPadding}"
      ></frame-rectangle> */}
    </svg>
    {/* <grid-lines
      v-if="collageEditorShared.gridEnabled"
      :grid-cell="collageEditorShared.gridCell"
      :origin="{x: editorPadding, y: editorPadding}"
    ></grid-lines> */}
  </div>
}