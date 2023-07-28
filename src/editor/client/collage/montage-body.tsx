import { BodySpec, Montage as FileMontage, MontageFrame as FileMontageFrame } from "engine/file/collage"
import { Collage as RealCollage } from "engine/graphics/collage"
import { Rect } from "engine/math/rect"
import { Immutable } from "engine/utils/immutable"
import { assert } from "globals"
import { useContext, useMemo } from "preact/hooks"
import { UserInputsContext } from "../common/user-inputs"
import { FileCollage } from "../file-types"
import { GridSnapMover } from "../utils/grid-snap-mover"
import { ImmutableSetter, makeStyleString, onlyLeft } from "../utils/preact-help"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import RenderedMontageTrace from "./rendered-montage-trace"
import { EDITOR_PADDING } from "./shared-types"
import { markEventAsPropertiesSet } from "./event-properties-set"

type MontageBodyProps = {
  collage: FileCollage
  editAffectsAllFrames: boolean
  montage: Immutable<FileMontage>
  montageFrame: Immutable<FileMontageFrame>
  realCollage: RealCollage
  scale: number
  setCollage?: ImmutableSetter<FileCollage>
  traceIdInProgress?: string | null
  setTraceIdInProgress?: (id: string | null) => void
}

const strokeWidth = 2

export default function MontageBody(props: MontageBodyProps) {
  const {
    collage,
    editAffectsAllFrames,
    montage,
    montageFrame,
    realCollage,
    scale,
    setCollage,
    traceIdInProgress,
    setTraceIdInProgress,
  } = props

  const body = montage.body

  const editorInputs = useContext(UserInputsContext)
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
        console.log(dx, ", ", dy)
        const dxScaled = dx / scale
        const dyScaled = dy / scale
        snappedMover.applyDelta(dxScaled, dyScaled)
        const snappedDelta = snappedMover.getSnappedDelta()
        console.log(snappedDelta)
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

  return <svg style={svgStyle}>
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
  </svg>
}
