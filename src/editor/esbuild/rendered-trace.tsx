import { FileData, Trace } from "api/file"
import { Immutable } from "engine/utils/immutable"
import { generateUID } from "engine/utils/misc"
import { Coordinates2D, Coordinates3D } from "engine/world/level/level-location"
import { Type as TraceType } from "engine/world/level/trace/trace-misc"
import { TraceSpec } from "engine/world/level/trace/trace-spec"
import { calculateStairsPlane } from "engine/world/level/trace/trace-stairs-helper"
import { useEffect, useMemo, useState } from "preact/hooks"
import { getPlaceholderImage, PLACEHOLDER_WIDTH, safeGetColor } from "./editor-functions"
import { ImmutableSetter, makeImmutableObjectSetterUpdater, makeStyleString, onlyLeft, preventDefault } from "./preact-help"
import { ServerLiaison } from "./server-liaison"
import { EditorMetadata } from "./shared-types"
import { TRACE_GROUND_COLOR, TRACE_GROUND_HIGHLIGHT_COLOR } from "./trace-options"

type RenderedTraceProps = {
  acceptMouse: boolean
  metadata: Immutable<EditorMetadata>
  setMetadata?: ImmutableSetter<EditorMetadata>
  pointsArray: (Readonly<Coordinates2D> | null)[]
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

  const vertices = useMemo<Coordinates3D[]>(() => {
    const nonNullPoints = pointsArray.filter(point => {
      return point !== null
    }) as Readonly<Coordinates2D>[]
    return nonNullPoints.map(point => {
      return {
        x: point.x,
        y: point.y,
        z: trace.z
      }
    })
  }, [pointsArray, trace])

  const mousableStyle = makeStyleString({
    "pointer-events": acceptMouse ? "initial" : "none"
  })

  const points = useMemo(() => {
    return pointsArray.map(point => {
      if(point !== null) {
        const y = point.y - trace.z
        return point.x + "," + y
      } else if(pointsArray.length > 0 && pointsArray[0] !== null) {
        const y = pointsArray[0].y - trace.z
        return pointsArray[0].x + "," + y
      }
      return ""
    }).join(" ")
  }, [pointsArray, trace])
  const pointsShadow = useMemo(() => {
    const pointsArray2D = pointsArray
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
  }, [pointsArray, trace])
  const pointsStairsSlope = useMemo(() => {
    const pointsArray2D = pointsArray
    let pointsArray3D: (Coordinates3D)[] = []
    if(trace.type === TraceType.STAIRS && !!trace.direction && pointsArray2D.length >= 3) {
      const officialTrace = TraceSpec.fromRaw(trace)
      pointsArray3D = calculateStairsPlane(officialTrace, pointsArray2D)
    }
    return pointsArray3D.reduce(function(pointsStr, point) {
      const y = point.y - point.z
      return pointsStr + " " + point.x + "," + y
    }, "")
  }, [pointsArray, trace])

  const otherLevelDisplayed = (trace.type === TraceType.POINTER ||
    trace.type === TraceType.TRANSPORT) && metadata.highlighted

  function useOtherLevel(s: ServerLiaison, levelId: string) {
    const [levelJson, setLevelJson] = useState<FileData | null>(null)
    useEffect(() => {
      s.api.levelJson.fetch(s.withProject({ levelId })).then(setLevelJson)
    }, [levelId])
    return [levelJson]
  }
  const [otherLevel] = useOtherLevel(server, trace.level)

  const otherLevelImgSrc = otherLevel === null ? getPlaceholderImage() : server.imgSrc(otherLevel.background)

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
        x={-trace.offsetX}
        y={-trace.offsetY + trace.offsetZ}
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
      points={points}
      stroke={traceStroke}
      fill={traceFill}
    />}
    {/* Points/vertices */}
    {metadata.displayed && vertices.map((vertex) => (
    <circle
      style={mousableStyle}
      className="hoverable"
      cx={vertex.x}
      cy={vertex.y - vertex.z}
      r="3"
      onMouseDown={onlyLeft((e) => track(e, vertex))}
    />
    ))}
    {/* Outline for ramp/slope part of stairs; adds more of a 3D look */}
    {metadata.displayed && pointsStairsSlope && <polyline
      points={pointsStairsSlope}
      stroke="red" stroke-width="5" fill="none"
      style="pointer-events: none;"
    />}
    {/* Up-arrows fill pattern on ramp/slope plus additional dashed outline on top of the previous */}
    {metadata.displayed && pointsStairsSlope && <polyline
      points={pointsStairsSlope}
      stroke="black" stroke-width="2" stroke-dasharray="10,5"
      fill="url(#up-arrows-pattern)"
      style="pointer-events: none;"
    />}
    {/* Outline and fill for the top (z-axis/height) face area of the trace's volume */}
    {metadata.displayed && traceShadowDisplayed && <polyline
      points={pointsShadow}
      fill={traceShadowFill}
      stroke={traceShadowStroke}
      style="pointer-events: none;"
    />}
  </g>
}
