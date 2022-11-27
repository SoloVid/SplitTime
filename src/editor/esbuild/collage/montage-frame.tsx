import { SharedStuffViewOnly, SharedStuff } from "./collage-editor-shared"
import { Montage as FileMontage, MontageFrame as FileMontageFrame } from "engine/file/collage"
import { useMemo, useRef } from "preact/hooks"
import { Rect } from "engine/math/rect"
import { makeStyleString } from "../preact-help"
import { EDITOR_PADDING, PropertiesEvent } from "./shared-types"
import { Trace as FileTrace } from "engine/world/level/level-file-data"
import { Type as TraceType } from "engine/world/level/trace/trace-misc"
import { assert } from "globals"
import { Immutable } from "engine/utils/immutable"
import { DEFAULT_GROUP_HEIGHT } from "../editor-functions"
import RenderedMontageTrace from "./rendered-montage-trace"

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

  const $el = useRef<HTMLDivElement>(null)

  const body = montage.body
  const editorInputs = collageViewHelper.globalStuff.userInputs

  const bodyFrontRectRelative = useMemo(() => {
    return Rect.make(
      -body.width / 2,
      body.depth / 2 - body.height,
      body.width,
      body.height
    )
  }, [body])

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

  const frameTargetBox = useMemo(() => {
    return frame.getTargetBox(body)
  }, [frame, body])

  const imageDivStyle = useMemo(() => {
    const styleMap = {
      position: 'relative',
      overflow: 'hidden',
      width: frameTargetBox.width + 'px',
      height: frameTargetBox.height + 'px',
      outline: highlight ? "4px solid red" : "none"
    }
    return makeStyleString(styleMap)
  }, [frameTargetBox, highlight])

  const inputs = useMemo(() => {
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
      x: editorInputs.mouse.x - position.x,
      y: editorInputs.mouse.y - position.y,
      isDown: editorInputs.mouse.isDown
    }
    return {
      mouse,
      ctrlDown: editorInputs.ctrlDown
    }
  }, [$el.current, editorInputs])

  const svgStyle = useMemo(() => {
    const styleMap = {
      position: 'absolute',
      left: (-EDITOR_PADDING) + "px",
      top: (-EDITOR_PADDING) + "px",
      width: (frameTargetBox.width + 2 * EDITOR_PADDING) + "px",
      height: (frameTargetBox.height + 2 * EDITOR_PADDING) + "px",
      // Note: pointer events need to be manually turned back on for child elements that care
      "pointer-events": "none"
    }
    return makeStyleString(styleMap)
  }, [frameTargetBox])

  const svgTransform = useMemo(() => {
    // Note that the frameTargetBox coordinates are typically negative
    const x = EDITOR_PADDING - frameTargetBox.x
    const y = EDITOR_PADDING - frameTargetBox.y
    return "translate(" + x + " " + y + ")"
  }, [frameTargetBox])

  const imgSrc = collageViewHelper.globalStuff.server.imgSrc(collageViewHelper.collage.image)

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
    collageEditHelper.follow({
      shift(dx: number, dy: number) {
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
                  offsetX: mf.offsetX - dx,
                  offsetY: mf.offsetY - dy,
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

    const y = inputs.mouse.y + frameTargetBox.y
    const x = inputs.mouse.x + frameTargetBox.x
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

  return <div style="position: relative;"
    ref={$el}
    onContextMenu={(e) => e.preventDefault()}
    onMouseUp={handleMouseUp}
  >
    <div
      style={imageDivStyle}
    >
      <img 
        src={imgSrc}
        style={`position: absolute; left: ${-frame.box.x}px; top: ${-frame.box.y}px`}
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
        x={bodyFrontRectRelative.x}
        y={bodyFrontRectRelative.y + body.height - body.depth}
        width={body.width}
        height={body.depth}
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
        x={bodyFrontRectRelative.x}
        y={bodyFrontRectRelative.y}
        width={bodyFrontRectRelative.width}
        height={bodyFrontRectRelative.height}
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
        x={bodyFrontRectRelative.x}
        y={bodyFrontRectRelative.y - body.depth}
        width={body.width}
        height={body.depth}
        fill="url(#diagonal-hatch)"
        stroke="red"
        stroke-width="2"
        stroke-dasharray="2,1"
      />
    </svg>}
  </div>
}
