import { SharedStuffViewOnly, SharedStuff } from "./collage-editor-shared"
import { BodySpec, Montage as FileMontage, MontageFrame as FileMontageFrame } from "engine/file/collage"
import { useContext, useMemo, useRef } from "preact/hooks"
import { Rect } from "engine/math/rect"
import { makeStyleString } from "../preact-help"
import { EDITOR_PADDING, PropertiesEvent } from "./shared-types"
import { Trace as FileTrace } from "engine/world/level/level-file-data"
import { Type as TraceType } from "engine/world/level/trace/trace-misc"
import { assert } from "globals"
import { Immutable } from "engine/utils/immutable"
import { DEFAULT_GROUP_HEIGHT } from "../editor-functions"
import RenderedMontageTrace from "./rendered-montage-trace"
import { imageContext } from "../server-liaison"
import { getRelativeMouse } from "../shared-types"
import { useScaledImageDimensions } from "../utils/scaled-image"
import { useScaledImageSize } from "../utils/image-size"
import { GridSnapMover } from "../grid-snap-mover"

type MontageFrameProps = {
  collageEditHelper: SharedStuff | undefined
  collageViewHelper: SharedStuffViewOnly
  editAffectsAllFrames: boolean
  highlight: boolean
  montageIndex: number
  montage: Immutable<FileMontage>
  montageFrameIndex: number
  montageFrame: Immutable<FileMontageFrame>
}

export default function MontageFrame(props: MontageFrameProps) {
  const {
    collageEditHelper,
    collageViewHelper,
    editAffectsAllFrames,
    highlight,
    montageIndex,
    montage,
    montageFrameIndex,
    montageFrame,
  } = props

  const $el = useRef<HTMLDivElement>(document.createElement("div"))

  const body = montage.body
  const editorInputs = collageViewHelper.globalStuff.userInputs
  const scale = collageViewHelper.globalStuff.scale

  const bodyS: BodySpec = {
    width: body.width * scale,
    depth: body.depth * scale,
    height: body.height * scale,
  }

  const bodyFrontRectRelative = useMemo(() => {
    return Rect.make(
      -body.width / 2,
      body.depth / 2 - body.height,
      body.width,
      body.height
    )
  }, [body])
  const bodyFrontRectRelativeS = useMemo(() => Rect.make(
    bodyFrontRectRelative.x * scale,
    bodyFrontRectRelative.y * scale,
    bodyFrontRectRelative.width * scale,
    bodyFrontRectRelative.height * scale,
  ), [bodyFrontRectRelative])

  const frame = useMemo(() => {
    const montageIndex = collageViewHelper.collage.montages.indexOf(montage)
    const montageFrameIndex = montage.frames.indexOf(montageFrame)
    return collageViewHelper.realCollage.montages[montageIndex].frames[montageFrameIndex]
  }, [
    collageViewHelper.collage.montages,
    montage,
    montageFrame,
    collageViewHelper.realCollage.montages,
  ])

  const frameBoxS = useMemo(() => {
    return Rect.make(
      frame.box.x * scale,
      frame.box.y * scale,
      frame.box.width * scale,
      frame.box.height * scale,
    )
  }, [frame.box, scale])

  const frameTargetBox = useMemo(() => {
    return frame.getTargetBox(body)
  }, [frame, body])

  const frameTargetBoxS = useMemo(() => {
    return Rect.make(
      frameTargetBox.x * scale,
      frameTargetBox.y * scale,
      frameTargetBox.width * scale,
      frameTargetBox.height * scale,
    )
  }, [frameTargetBox, scale])

  const imageDivStyle = useMemo(() => {
    const styleMap = {
      position: 'relative',
      overflow: 'hidden',
      width: frameTargetBoxS.width + 'px',
      height: frameTargetBoxS.height + 'px',
      outline: highlight ? "4px solid red" : "none"
    }
    return makeStyleString(styleMap)
  }, [frameTargetBox, highlight])

  const inputs = useMemo(() => {
    const basicRelMouse = getRelativeMouse(editorInputs, $el.current)
    const mouse = {
      x: Math.round((basicRelMouse.x / scale) + frameTargetBox.x),
      y: Math.round((basicRelMouse.y / scale) + frameTargetBox.y),
      isDown: editorInputs.mouse.isDown
    }
    return {
      mouse,
      ctrlDown: editorInputs.ctrlDown
    }
  }, [$el.current, editorInputs, frameTargetBox, scale])

  const svgStyle = useMemo(() => {
    const styleMap = {
      position: 'absolute',
      left: (-EDITOR_PADDING) + "px",
      top: (-EDITOR_PADDING) + "px",
      width: (frameTargetBoxS.width + 2 * EDITOR_PADDING) + "px",
      height: (frameTargetBoxS.height + 2 * EDITOR_PADDING) + "px",
      // Note: pointer events need to be manually turned back on for child elements that care
      "pointer-events": "none"
    }
    return makeStyleString(styleMap)
  }, [frameTargetBoxS])

  const svgTransform = useMemo(() => {
    // Note that the frameTargetBox coordinates are typically negative
    const x = EDITOR_PADDING - frameTargetBoxS.x
    const y = EDITOR_PADDING - frameTargetBoxS.y
    return "translate(" + x + " " + y + ")"
  }, [frameTargetBoxS])

  const projectImages = useContext(imageContext)
  const imgSrc = projectImages.imgSrc(collageViewHelper.collage.image)
  const scaledImageSize = useScaledImageSize(imgSrc, scale)

  function markEventAsPropertiesSet(event: MouseEvent): void {
    // Somewhat type-unsafe way of letting upper events know they should try to set properties
    const anyEvent = event as PropertiesEvent
    anyEvent.propertiesPanelSet = true
  }

  function editBody(event: MouseEvent): void {
    assert(!!collageEditHelper, "editBody() must be called with edit helper")
    collageEditHelper.setPropertiesPath(["montages", montageIndex, "body"])
    markEventAsPropertiesSet(event)
    event.preventDefault()
    collageEditHelper.setTraceInProgress(null)
  }

  function trackBody(event: MouseEvent): void {
    assert(!!collageEditHelper, "trackBody() must be called with edit helper")
    if (collageEditHelper.traceInProgress) {
      return
    }
    const original = { x: montageFrame.offsetX, y: montageFrame.offsetY }
    const originals = montage.frames.map(mf => ({ x: mf.offsetX, y: mf.offsetY }))
    const snappedMover = new GridSnapMover({ x: 1, y: 1 }, [original])
    collageEditHelper.follow({
      shift(dx: number, dy: number) {
        const dxScaled = dx / scale
        const dyScaled = dy / scale
        snappedMover.applyDelta(dxScaled, dyScaled)
        const snappedDelta = snappedMover.getSnappedDelta()
        collageEditHelper.setCollage((before) => ({
          ...before,
          montages: before.montages.map((m, i) => {
            if (i !== montageIndex) {
              return m
            }
            return {
              ...m,
              frames: m.frames.map((mf, j) => {
                if (!editAffectsAllFrames && j !== montageFrameIndex) {
                  return mf
                }
                return {
                  ...mf,
                  offsetX: Math.round(originals[j].x - snappedDelta.x),
                  offsetY: Math.round(originals[j].y - snappedDelta.y),
                }
              })
            }
          })
        }))
      }
    })
    event.preventDefault()
  }

  function addNewTrace(montage: FileMontage, type: string): FileTrace {
    const z = 0
    const defaultHeight = DEFAULT_GROUP_HEIGHT
    let height = defaultHeight
    if(type === TraceType.GROUND) {
      type = TraceType.SOLID
      height = 0
    }
    const t = {
      id: "",
      group: "",
      type: type,
      vertices: "",
      z: z,
      height: height,
      direction: "",
      event: "",
      level: "",
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      targetPosition: ""
    }
    collageEditHelper?.setCollage((before) => ({
      ...before,
      montages: before.montages.map((m, i) => {
        if (i !== montageIndex) {
          return m
        }
        return {
          ...m,
          traces: [...m.traces, t],
        }
      }),
    }))
    return t
  }

  function handleMouseUp(event: MouseEvent): void {
    const helper = collageEditHelper || null
    // FTODO: Allow editing from animated montage
    // Right now, there are some issues with position for montages in showcase
    if (helper === null || editAffectsAllFrames) {
      return
    }

    const y = inputs.mouse.y
    const x = inputs.mouse.x
    const isLeftClick = event.which === 1
    const isRightClick = event.which === 3

    const gridCell = { x: 1, y: 1 }
    const snappedX = Math.round(x / gridCell.x) * gridCell.x
    const snappedY = Math.round(y / gridCell.y) * gridCell.y
    const literalPoint = "(" +
      Math.floor(snappedX) + ", " +
      Math.floor(snappedY) + ")"
    const traceInProgress = helper.traceInProgress
    const traceType = helper.traceTypeSelected
    if(isLeftClick) {
      if(traceInProgress) {
        traceInProgress.vertices = traceInProgress.vertices + " " + literalPoint
        markEventAsPropertiesSet(event)
      }
    } else if(isRightClick) {
      if(!traceInProgress) {
        const trace = addNewTrace(montage, traceType)
        const newTraceIndex = montage.traces.length
        trace.vertices = literalPoint
        helper.setTraceInProgress(trace)
        helper.setPropertiesPath(["montages", montageIndex, "traces", newTraceIndex])
        markEventAsPropertiesSet(event)
      } else {
        if(!inputs.ctrlDown) {
          traceInProgress.vertices = traceInProgress.vertices + " (close)"
        }
        helper.setTraceInProgress(null)
        markEventAsPropertiesSet(event)
      }
    }
  }

  function handleMouseMove(event: MouseEvent): void {
    collageEditHelper?.setInfo((before) => ({
      ...before,
      x: inputs.mouse.x,
      ["y-z"]: inputs.mouse.y,
    }))
  }

  function handleMouseOut(event: MouseEvent): void {
    collageEditHelper?.setInfo((before) => {
      const { x, ["y-z"]: y, ...restBefore } = before
      return restBefore
    })
  }

  return <div style="position: relative;"
    ref={$el}
    onContextMenu={(e) => e.preventDefault()}
    onMouseUp={handleMouseUp}
    onMouseMove={handleMouseMove}
    onMouseOut={handleMouseOut}
  >
    <div
      style={imageDivStyle}
    >
      <img
        src={imgSrc}
        width={scaledImageSize?.width}
        height={scaledImageSize?.height}
        //width=${scaledImageDimensions.x}px; height=${scaledImageDimensions.y}px;
        style={`position: absolute; left: ${-frameBoxS.x}px; top: ${-frameBoxS.y}px`}
      />
    </div>
    {collageEditHelper && <svg style={svgStyle}>
      {montage.traces.map((trace, i) => (
        <RenderedMontageTrace
          collageEditHelper={collageEditHelper}
          collageViewHelper={collageViewHelper}
          montageIndex={montageIndex}
          montage={montage}
          montageFrame={montageFrame}
          // metadata={{}}
          traceIndex={i}
          trace={trace}
          transform={svgTransform}
        />
      ))}
      {/* Base */}
      <rect
        transform={svgTransform}
        x={bodyFrontRectRelativeS.x}
        y={bodyFrontRectRelativeS.y + bodyS.height - bodyS.depth}
        width={bodyS.width}
        height={bodyS.depth}
        stroke="red"
        stroke-width="2"
        stroke-dasharray="2,1"
        fill="none"
      />
      {/* Front */}
      <rect
        transform={svgTransform}
        style="pointer-events: initial; cursor: grab;"
        onMouseDown={(e) => { if (e.button === 0) trackBody(e) }}
        onDblClick={editBody}
        x={bodyFrontRectRelativeS.x}
        y={bodyFrontRectRelativeS.y}
        width={bodyFrontRectRelativeS.width}
        height={bodyFrontRectRelativeS.height}
        fill="url(#diagonal-hatch)"
        stroke="red"
        stroke-width="2"
        stroke-dasharray="2,1"
      />
      {/* Top */}
      <rect
        transform={svgTransform}
        style="pointer-events: initial; cursor: grab;"
        onMouseDown={(e) => { if (e.button === 0) trackBody(e) }}
        onDblClick={editBody}
        x={bodyFrontRectRelativeS.x}
        y={bodyFrontRectRelativeS.y - bodyS.depth}
        width={bodyS.width}
        height={bodyS.depth}
        fill="url(#diagonal-hatch)"
        stroke="red"
        stroke-width="2"
        stroke-dasharray="2,1"
      />
    </svg>}
  </div>
}
