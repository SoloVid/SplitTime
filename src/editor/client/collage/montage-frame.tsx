import { BodySpec, Montage as FileMontage, MontageFrame as FileMontageFrame } from "engine/file/collage"
import { Collage as RealCollage } from "engine/graphics/collage"
import { Rect } from "engine/math/rect"
import { Immutable } from "engine/utils/immutable"
import { Trace as FileTrace } from "engine/world/level/level-file-data"
import { TraceType, TraceTypeType } from "engine/world/level/trace/trace-type"
import { assert } from "globals"
import { useContext, useEffect, useMemo, useRef } from "preact/hooks"
import { InfoPaneContext } from "../common/info-pane"
import { imageContext } from "../common/server-liaison"
import { UserInputsContext, getRelativeMouse } from "../common/user-inputs"
import { DEFAULT_GROUP_HEIGHT } from "../editor-functions"
import { FileCollage } from "../file-types"
import { GridSnapMover } from "../utils/grid-snap-mover"
import { useScaledImageSize } from "../utils/image-size"
import { ImmutableSetter, makeStyleString, onlyLeft } from "../utils/preact-help"
import RenderCounter from "../utils/render-counter"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import RenderedMontageTrace from "./rendered-montage-trace"
import { EDITOR_PADDING, PropertiesEvent } from "./shared-types"
import { findTraceInCollage, updateTraceInCollage } from "./find-trace"

type MontageFrameProps = {
  collage: FileCollage
  editAffectsAllFrames: boolean
  highlight: boolean
  montage: Immutable<FileMontage>
  montageFrame: Immutable<FileMontageFrame>
  realCollage: RealCollage
  scale: number
  setCollage?: ImmutableSetter<FileCollage>
  traceIdInProgress?: string | null
  setTraceIdInProgress?: (id: string | null) => void
}

const strokeWidth = 2

export default function MontageFrame(props: MontageFrameProps) {
  const {
    collage,
    editAffectsAllFrames,
    highlight,
    montage,
    montageFrame,
    realCollage,
    scale,
    setCollage,
    traceIdInProgress,
    setTraceIdInProgress,
  } = props

  const $el = useRef<HTMLDivElement>(document.createElement("div"))

  const body = montage.body
  const editorInputs = useContext(UserInputsContext)
  // const scale = collageViewHelper.globalStuff.scale
  const [info, setInfo] = useContext(InfoPaneContext)
  const [collagePrefs, setCollagePrefs] = useContext(CollageEditorPreferencesContext)

  const bodyS = useMemo<BodySpec>(() => ({
    width: body.width * scale,
    depth: body.depth * scale,
    height: body.height * scale,
  }), [body, scale])

  const bodyBackRectRelative = useMemo(() => {
    return Rect.make(
      -body.width / 2,
      body.depth / 2 - body.height - body.depth,
      body.width,
      body.height
    )
  }, [body])
  const bodyBackRectRelativeS = useMemo(() => Rect.make(
    bodyBackRectRelative.x * scale,
    bodyBackRectRelative.y * scale,
    bodyBackRectRelative.width * scale,
    bodyBackRectRelative.height * scale,
  ), [bodyBackRectRelative, scale])

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
  ), [bodyFrontRectRelative, scale])

  const frame = useMemo(() => {
    const montageIndex = collage.montages.indexOf(montage)
    const montageFrameIndex = montage.frames.indexOf(montageFrame)
    return realCollage.montages[montageIndex].frames[montageFrameIndex]
  }, [
    collage.montages,
    montage,
    montageFrame,
    realCollage.montages,
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
  }, [frameTargetBoxS, highlight])

  const inputs = useMemo(() => {
    if (editorInputs === null) {
      return {
        mouse: { x: 0, y: 0, isDown: false },
        ctrlDown: false,
      }
    }

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
  }, [frameTargetBoxS, EDITOR_PADDING])

  const svgTransform = useMemo(() => {
    // Note that the frameTargetBox coordinates are typically negative
    const x = EDITOR_PADDING - frameTargetBoxS.x
    const y = EDITOR_PADDING - frameTargetBoxS.y
    return "translate(" + x + " " + y + ")"
  }, [frameTargetBoxS, EDITOR_PADDING])

  const projectImages = useContext(imageContext)
  const imgSrc = projectImages.imgSrc(collage.image)
  const scaledImageSize = useScaledImageSize(imgSrc, scale)

  const editBody = useMemo(() => (event: MouseEvent): void => {
    assert(!!setTraceIdInProgress, "editBody() must be called with setTraceIdInProgress")
    setCollagePrefs((before) => ({
      ...before,
      propertiesPanel: {
        type: "body",
        id: montage.id,
      },
    }))
    markEventAsPropertiesSet(event)
    event.preventDefault()
    setTraceIdInProgress(null)
  }, [setCollagePrefs, setTraceIdInProgress])

  const trackBody = useMemo(() => (event: MouseEvent): void => {
    assert(!!setCollage, "trackBody() must be called with setCollage")
    if (traceIdInProgress) {
      return
    }
    const original = { x: montageFrame.offsetX, y: montageFrame.offsetY }
    const originals = montage.frames.map(mf => ({ x: mf.offsetX, y: mf.offsetY }))
    const snappedMover = new GridSnapMover({ x: 1, y: 1 }, [original])
    editorInputs?.setFollowers(() => [{
      shift(dx: number, dy: number) {
        const dxScaled = dx / scale
        const dyScaled = dy / scale
        snappedMover.applyDelta(dxScaled, dyScaled)
        const snappedDelta = snappedMover.getSnappedDelta()
        setCollage((before) => ({
          ...before,
          montages: before.montages.map((m) => {
            if (m.id !== montage.id) {
              return m
            }
            return {
              ...m,
              frames: m.frames.map((mf, j) => {
                if (!editAffectsAllFrames && mf.id !== montageFrame.id) {
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
    }])
    event.preventDefault()
  }, [editAffectsAllFrames, editorInputs?.setFollowers, montage, montageFrame, scale, setCollage, traceIdInProgress])

  const addNewTrace = useMemo(() => (montage: FileMontage, type: TraceTypeType): FileTrace => {
    const z = 0
    const defaultHeight = DEFAULT_GROUP_HEIGHT
    let height = defaultHeight
    if(type === TraceType.GROUND) {
      type = TraceType.SOLID
      height = 0
    }
    const t = {
      id: "",
      name: "",
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
      targetPosition: "",
      color: "",
    }
    setCollage?.((before) => ({
      ...before,
      montages: before.montages.map((m, i) => {
        if (m.id !== montage.id) {
          return m
        }
        return {
          ...m,
          traces: [...m.traces, t],
        }
      }),
    }))
    return t
  }, [setCollage])

  const handleMouseUp = useMemo(() => (event: MouseEvent): void => {
    // FTODO: Allow editing from animated montage
    // Right now, there are some issues with position for montages in showcase
    if (!setTraceIdInProgress || !setCollage || editAffectsAllFrames) {
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
    const traceInProgress = traceIdInProgress ? findTraceInCollage(collage, traceIdInProgress) : null
    const traceType = collagePrefs.traceType
    if(isLeftClick) {
      if(traceInProgress) {
        updateTraceInCollage(setCollage, traceInProgress.id, (before) => ({
          ...before,
          vertices: before.vertices + " " + literalPoint,
        }))
        markEventAsPropertiesSet(event)
      }
    } else if(isRightClick) {
      if(!traceInProgress) {
        const trace = addNewTrace(montage, traceType)
        trace.vertices = literalPoint
        setTraceIdInProgress(trace.id)
        setCollagePrefs((before) => ({
          ...before,
          propertiesPanel: {
            type: "trace",
            id: trace.id,
          },
        }))
        markEventAsPropertiesSet(event)
      } else {
        if(!inputs.ctrlDown) {
          updateTraceInCollage(setCollage, traceInProgress.id, (before) => ({
            ...before,
            vertices: before.vertices + " (close)",
          }))
        }
        setTraceIdInProgress(null)
        markEventAsPropertiesSet(event)
      }
    }
  }, [addNewTrace, collage, collagePrefs.traceType, editAffectsAllFrames, inputs, setCollage, setCollagePrefs, setTraceIdInProgress, traceIdInProgress])

  const handleMouseMove = useMemo(() => (event: MouseEvent): void => {
    setInfo((before) => ({
      ...before,
      x: inputs.mouse.x,
      ["y-z"]: inputs.mouse.y,
    }))
  }, [inputs, setInfo])

  const handleMouseOut = useMemo(() => (event: MouseEvent): void => {
    setInfo((before) => {
      const { x, ["y-z"]: y, ...restBefore } = before
      return restBefore
    })
  }, [setInfo])

  function debugField(field: string, value: unknown) {
    useEffect(() => {
      console.log(`${field} changed`)
    }, [value])
  }

  // debugField("$el", $el)
  // debugField("bodyBackRectRelativeS", bodyBackRectRelativeS)
  // debugField("bodyFrontRectRelativeS", bodyFrontRectRelativeS)
  // debugField("bodyS", bodyS)
  // debugField("collage", collage)
  // debugField("editBody", editBody)
  // debugField("frameBoxS", frameBoxS)
  // debugField("handleMouseMove", handleMouseMove)
  // debugField("handleMouseOut", handleMouseOut)
  // debugField("handleMouseUp", handleMouseUp)
  // debugField("imageDivStyle", imageDivStyle)
  // debugField("imgSrc", imgSrc)
  // debugField("montage", montage)
  // debugField("montageFrame", montageFrame)
  // debugField("scale", scale)
  // debugField("scaledImageSize", scaledImageSize)
  // debugField("setCollage", setCollage)
  // debugField("svgStyle", svgStyle)
  // debugField("svgTransform", svgTransform)
  // debugField("trackBody", trackBody)

  return useMemo(() => <div style="position: relative;"
    ref={$el}
    onContextMenu={(e) => e.preventDefault()}
    onMouseUp={handleMouseUp}
    onMouseMove={handleMouseMove}
    onMouseOut={handleMouseOut}
  >
    <div
      style={imageDivStyle}
    >
      <RenderCounter debugLabel="frame"></RenderCounter>
      <img
        src={imgSrc}
        width={scaledImageSize?.width}
        height={scaledImageSize?.height}
        //width=${scaledImageDimensions.x}px; height=${scaledImageDimensions.y}px;
        style={`position: absolute; left: ${-frameBoxS.x}px; top: ${-frameBoxS.y}px`}
      />
    </div>
    {setCollage && <svg style={svgStyle}>
      {montage.traces.map((trace, i) => (
        <RenderedMontageTrace
          collage={collage}
          montage={montage}
          montageFrame={montageFrame}
          scale={scale}
          traceIndex={i}
          trace={trace}
          transform={svgTransform}
        />
      ))}
      {/* Back */}
      <rect
        transform={svgTransform}
        x={bodyBackRectRelativeS.x}
        y={bodyBackRectRelativeS.y}
        width={bodyBackRectRelativeS.width}
        height={bodyBackRectRelativeS.height}
        fill="rgba(100, 100, 100, 0.5)"
        stroke="none"
      />
      {/* Base */}
      <rect
        transform={svgTransform}
        x={bodyFrontRectRelativeS.x + strokeWidth / 2}
        y={bodyFrontRectRelativeS.y + bodyS.height - bodyS.depth + strokeWidth / 2}
        width={Math.max(0, bodyS.width - strokeWidth)}
        height={Math.max(0, bodyS.depth - strokeWidth)}
        fill="url(#diagonal-hatch)"
        stroke="black"
        stroke-width={strokeWidth}
        stroke-dasharray="2,1"
      />
      {/* Front */}
      <rect
        transform={svgTransform}
        style="pointer-events: initial; cursor: grab;"
        onMouseDown={onlyLeft(trackBody, true)}
        onDblClick={editBody}
        x={bodyFrontRectRelativeS.x}
        y={bodyFrontRectRelativeS.y}
        width={bodyFrontRectRelativeS.width}
        height={bodyFrontRectRelativeS.height}
        fill="rgba(255, 0, 0, 0.5)"
        stroke="none"
      />
      {/* Top */}
      <rect
        transform={svgTransform}
        style="pointer-events: initial; cursor: grab;"
        onMouseDown={onlyLeft(trackBody, true)}
        onDblClick={editBody}
        x={bodyFrontRectRelativeS.x + strokeWidth / 2}
        y={bodyFrontRectRelativeS.y - bodyS.depth + strokeWidth / 2}
        width={Math.max(0, bodyS.width - strokeWidth)}
        height={Math.max(0, bodyS.depth - strokeWidth)}
        fill="url(#diagonal-hatch)"
        stroke="red"
        stroke-width={strokeWidth}
        stroke-dasharray="2,1"
      />
    </svg>}
  </div>, [
    $el,
    bodyBackRectRelativeS,
    bodyFrontRectRelativeS,
    bodyS,
    collage,
    editBody,
    frameBoxS,
    handleMouseMove,
    handleMouseOut,
    handleMouseUp,
    imageDivStyle,
    imgSrc,
    montage,
    montageFrame,
    scale,
    scaledImageSize,
    setCollage,
    svgStyle,
    svgTransform,
    trackBody,
  ])
}

function markEventAsPropertiesSet(event: MouseEvent): void {
  // Somewhat type-unsafe way of letting upper events know they should try to set properties
  const anyEvent = event as PropertiesEvent
  anyEvent.propertiesPanelSet = true
}
