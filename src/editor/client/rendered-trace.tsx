import { FileData, Trace } from "api/file"
import { Immutable } from "engine/utils/immutable"
import { generateUID } from "engine/utils/misc"
import { Coordinates2D, Coordinates3D } from "engine/world/level/level-location"
import { TraceType } from "engine/world/level/trace/trace-type"
import { TraceSpec } from "engine/world/level/trace/trace-spec"
import { calculateStairsPlane } from "engine/world/level/trace/trace-stairs-helper"
import { useContext, useEffect, useMemo, useState } from "preact/hooks"
import { getPlaceholderImage, PLACEHOLDER_WIDTH, safeGetColor } from "./editor-functions"
import { ImmutableSetter, makeImmutableObjectSetterUpdater, makeStyleString, onlyLeft, preventDefault } from "./preact-help"
import { imageContext, ServerLiaison } from "./server-liaison"
import { EditorMetadata } from "./shared-types"
import { TRACE_GROUND_COLOR, TRACE_GROUND_HIGHLIGHT_COLOR } from "./trace-options"
import { assert } from "globals"

type RenderedTraceProps = {
  acceptMouse: boolean
  metadata: Immutable<EditorMetadata>
  setMetadata?: ImmutableSetter<EditorMetadata>
  pointsArray: (Readonly<Coordinates2D> | null)[]
  scale?: number
  server: ServerLiaison
  shouldDragBePrevented: boolean
  trace: Immutable<Trace>
  tracker: IRenderedTraceTracker
  transform?: string
}

export interface IRenderedTraceTracker {
  track(event: MouseEvent, point?: Coordinates2D): void
}

export default function RenderedTrace(props: RenderedTraceProps) {
  const {
    acceptMouse,
    metadata,
    setMetadata,
    pointsArray,
    scale = 1,
    server,
    shouldDragBePrevented,
    trace,
    tracker,
    transform,
  } = props
  const updateMetadata = setMetadata ? makeImmutableObjectSetterUpdater(setMetadata) : undefined

  const [uid] = useState(generateUID())

  const hasClose = pointsArray.length > 0 && pointsArray[pointsArray.length - 1] === null
  const height = trace.height
  
  const pointsArrayS = useMemo(() => pointsArray.map(
    p => p === null ? null : { x: p.x * scale, y: p.y * scale}
  ), [pointsArray, scale])

  const vertices = useMemo(() => {
    const nonNullPoints = pointsArray.filter(point => {
      return point !== null
    }) as Readonly<Coordinates2D>[]
    return nonNullPoints.map(point => {
      const actual = {
        x: point.x,
        y: point.y,
        z: trace.z,
      }
      const scaled = {
        x: actual.x * scale,
        y: actual.y * scale,
        z: actual.z * scale,
      }
      return {actual, scaled}
    })
  }, [pointsArray, trace, scale])

  const mousableStyle = makeStyleString({
    "pointer-events": acceptMouse ? "initial" : "none"
  })

  const pointsS = useMemo(() => {
    return pointsArrayS.map(point => {
      if(point !== null) {
        const y = point.y - trace.z
        return point.x + "," + y
      } else if(pointsArrayS.length > 0 && pointsArrayS[0] !== null) {
        const y = pointsArrayS[0].y - trace.z
        return pointsArrayS[0].x + "," + y
      }
      return ""
    }).join(" ")
  }, [pointsArrayS, trace])
  const curvePathS = useMemo(() => {
    type BzCurveOptions = {
      /** true if closed polygon; false if dangling line termination */
      closedCircuit?: boolean
      /** 0 is straight line */
      f?: number
      /** Intended to be 1, but can tweak smoothness (lower values?). */
      t?: number
    }

    // Adapted from https://stackoverflow.com/a/39559854/4639640
    /**
     * Return sequence of specs for either
     * [CanvasRenderingContext2D.bezierCurveTo()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo) or
     * [SVG `C`](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#b%C3%A9zier_curves)
     */
    function bzCurve(
      points: readonly Coordinates2D[],
      {
        closedCircuit = false,
        f = 0.2,
        t = 1,
      }: BzCurveOptions = {}
    ) {
      function getRelativePoint(i: number, d: number) {
        if (closedCircuit) {
          return points[(i + d + points.length) % points.length]
        }
        const j = i + d
        if (j < 0 || j >= points.length) {
          return null
        }
        return points[j]
      }

      function getDxDy(p1: Coordinates2D | null, p2: Coordinates2D | null) {
        if (p1 === null || p2 === null) {
          return {
            x: 0,
            y: 0,
          }
        }
        return {
          x: (p2.x - p1.x) * -f,
          y: (p2.y - p1.y) * -f,
        }
      }

      function getCurveAt(i: number) {
        const prePreP = getRelativePoint(i, -2)
        const preP = getRelativePoint(i, -1)
        assert(preP !== null, `getCurveAt() returned null for preP (i = ${i})`)
        const curP = points[i]
        const nexP = getRelativePoint(i, +1)
        const d1 = getDxDy(prePreP, curP)
        const d2 = getDxDy(preP, nexP)
        return {
          control1: { x: preP.x - d1.x, y: preP.y - d1.y },
          control2: { x: curP.x + d2.x, y: curP.y + d2.y },
          target: { x: curP.x, y: curP.y },
        }
      }

      const bzCurves2 = points.slice(1).map((p, i) => getCurveAt(i + 1))
      if (closedCircuit) {
        bzCurves2.push(getCurveAt(0))
      }
      return bzCurves2

      const bzCurves: {
        control1: Coordinates2D,
        control2: Coordinates2D,
        target: Coordinates2D,
      }[] = []

      let m = 0
      let dx1 = 0
      let dy1 = 0

      let preP = closedCircuit ? points[points.length - 1] : points[0]
      for (let i = 1; i < points.length; i++) {
        const curP = points[i]
        const nexP = closedCircuit ? points[(i + 1) % points.length] : points[i + 1]
        let dx2: number
        let dy2: number
        if (nexP) {
          function slope(a: Coordinates2D, b: Coordinates2D) {
            return (b.y-a.y)/(b.x-a.x);
          }
          m = slope(preP, nexP)
          dx2 = (nexP.x - curP.x) * -f
          dy2 = dx2 * m * t
        } else {
          dx2 = 0
          dy2 = 0
        }
        console.log(`1: ${preP.x} - ${dx1}, ${preP.y} - ${dy1}`)
        console.log(`2: ${curP.x} + ${dx2}, ${curP.y} + ${dy2}`)
        bzCurves.push({
          control1: { x: preP.x - dx1, y: preP.y - dy1 },
          control2: { x: curP.x + dx2, y: curP.y + dy2 },
          target: { x: curP.x, y: curP.y },
        })
        dx1 = dx2
        dy1 = dy2
        preP = curP
      }

      return bzCurves
    }
    const defPoints = pointsArrayS.filter(p => p !== null) as Coordinates2D[]
    const fp = defPoints[0]
    const curves = bzCurve(defPoints, { closedCircuit: true })
    console.log(curves)
    const curveStrings = curves.map(c => `C ${c.control1.x} ${c.control1.y}, ${c.control2.x}, ${c.control2.y}, ${c.target.x} ${c.target.y}`)
    return `M ${fp.x} ${fp.y} ${curveStrings.join(" ")}` 
  }, [pointsArrayS, trace])
  const pointsShadowS = useMemo(() => {
    const pointsArray2D = pointsArrayS
    const pointsArray3D = pointsArray2D.map(point => {
      if(!point) {
        return null
      }
      const point3D = {
        x: point.x,
        y: point.y,
        z: trace.z + trace.height
      }
      return point3D
    })
    return pointsArray3D.reduce((pointsStr, point) => {
      var y
      if(point !== null) {
        y = point.y - point.z
        return pointsStr + " " + point.x + "," + y
      } else if(pointsArray3D.length > 0 && pointsArray3D[0] !== null) {
        y = pointsArray3D[0].y - pointsArray3D[0].z
        return pointsStr + " " + pointsArray3D[0].x + "," + y
      }
      return pointsStr
    }, "")
  }, [pointsArrayS, trace])
  const pointsStairsSlopeS = useMemo(() => {
    const pointsArray2D = pointsArrayS
    let pointsArray3D: (Coordinates3D)[] = []
    if(trace.type === TraceType.STAIRS && !!trace.direction && pointsArray2D.length >= 3) {
      const officialTrace = TraceSpec.fromRaw(trace)
      pointsArray3D = calculateStairsPlane(officialTrace, pointsArray2D)
    }
    return pointsArray3D.reduce(function(pointsStr, point) {
      const y = point.y - point.z
      return pointsStr + " " + point.x + "," + y
    }, "")
  }, [pointsArrayS, trace])

  const otherLevelDisplayed = (trace.type === TraceType.POINTER ||
    trace.type === TraceType.TRANSPORT) && metadata.highlighted

  function useOtherLevel(s: ServerLiaison, levelId: string | undefined) {
    const [levelJson, setLevelJson] = useState<FileData | null>(null)
    useEffect(() => {
      if (!levelId) {
        return
      }
      s.api.levelJson.fetch(s.withProject({ levelId })).then(setLevelJson)
    }, [levelId])
    return [levelJson]
  }
  const [otherLevel] = useOtherLevel(server, trace.level)

  const projectImages = useContext(imageContext)
  const otherLevelImgSrc = otherLevel === null ? getPlaceholderImage() : projectImages.imgSrc(otherLevel.background)

  function useImgDim(imgSrc: string | null) {
    const [dim, setDim] = useState({x: PLACEHOLDER_WIDTH, y: PLACEHOLDER_WIDTH})
    useEffect(() => {
      if (imgSrc === null) {
        return
      }
      const img = new Image()
      img.src = imgSrc
      img.onload = () => {
        setDim({
          x: img.width,
          y: img.height
        })
      }
    }, [imgSrc])
    return [dim]
  }
  const [otherLevelImgDim] = useImgDim(otherLevelImgSrc)

  const traceFill = useMemo(() => {
    if (!hasClose) {
      return "none"
    }
    if (otherLevelDisplayed && otherLevelImgSrc) {
      return "url(#img-" + uid + ")"
    }
    return safeGetColor(trace, metadata)
  }, [hasClose, otherLevelDisplayed, otherLevelImgSrc, uid, trace, metadata])
  const traceStroke = useMemo(() => {
    return hasClose ? "black" : safeGetColor(trace, metadata)
  }, [hasClose, trace, metadata])
  const traceShadowFill = metadata.highlighted ? TRACE_GROUND_HIGHLIGHT_COLOR : TRACE_GROUND_COLOR
  const traceShadowStroke = "black"
  const traceShadowDisplayed = hasClose && height > 0

  function track(event: MouseEvent, point?: Coordinates2D): void {
    if(shouldDragBePrevented) {
      return
    }
    tracker.track(event, point)
  }
  function toggleHighlight(highlight: boolean): void {
    if (!updateMetadata) {
      return
    }
    if(shouldDragBePrevented) {
      updateMetadata({highlighted: false})
      return
    }
    updateMetadata({highlighted: highlight})
  }

  return <g transform={transform}>
    <defs>
      {/* Window to linked level FTODO: change to showing more than just background */}
      {otherLevelDisplayed && otherLevel && <pattern
        id={'img-' + uid}
        x={-(trace.offsetX ?? 0)}
        y={-(trace.offsetY ?? 0) + (trace.offsetZ ?? 0)}
        width={otherLevel.width + 1000}
        height={otherLevel.height + 1000}
        patternUnits="userSpaceOnUse"
      >
        <rect
          x="0"
          y="0"
          width={otherLevel.width + 1000}
          height={otherLevel.height + 1000}
          fill="black"
        />
        <image
          x={otherLevel.backgroundOffsetX}
          y={otherLevel.backgroundOffsetY}
          width={otherLevelImgDim.x}
          height={otherLevelImgDim.y}
          preserveAspectRatio="none"
          href={otherLevelImgSrc}
        />
      </pattern>}
    </defs>
    {/* Base outline and fill */}
    {metadata.displayed && <polyline
      style={mousableStyle}
      onDblClick={preventDefault}
      onMouseDown={onlyLeft((e) => track(e, undefined))}
      onMouseMove={() => toggleHighlight(true)}
      onMouseLeave={() => toggleHighlight(false)}
      points={pointsS}
      stroke={traceStroke}
      fill={traceFill}
    />}
    {/* Curved outline */}
    {/* <path d="M 10 10 C 20 20, 40 20, 50 10" stroke="orange" fill="transparent"/> */}
    <path d={curvePathS} stroke="orange" fill="transparent"/>
    {/* Points/vertices */}
    {metadata.displayed && vertices.map((vertex) => (
    <circle
      style={mousableStyle}
      className="hoverable"
      cx={vertex.scaled.x}
      cy={vertex.scaled.y - vertex.scaled.z}
      r="3"
      onMouseDown={onlyLeft((e) => track(e, vertex.actual))}
    />
    ))}
    {/* Outline for ramp/slope part of stairs; adds more of a 3D look */}
    {metadata.displayed && pointsStairsSlopeS && <polyline
      points={pointsStairsSlopeS}
      stroke="red" stroke-width="5" fill="none"
      style="pointer-events: none;"
    />}
    {/* Up-arrows fill pattern on ramp/slope plus additional dashed outline on top of the previous */}
    {metadata.displayed && pointsStairsSlopeS && <polyline
      points={pointsStairsSlopeS}
      stroke="black" stroke-width="2" stroke-dasharray="10,5"
      fill="url(#up-arrows-pattern)"
      style="pointer-events: none;"
    />}
    {/* Outline and fill for the top (z-axis/height) face area of the trace's volume */}
    {metadata.displayed && traceShadowDisplayed && <polyline
      points={pointsShadowS}
      fill={traceShadowFill}
      stroke={traceShadowStroke}
      style="pointer-events: none;"
    />}
  </g>
}
