import { Type as TraceType } from "engine/world/level/trace/trace-misc"

export const TRACE_GROUND_COLOR = "rgba(100, 100, 100, .5)"
export const TRACE_GROUND_HIGHLIGHT_COLOR = "rgba(200, 200, 50, .5)"

export const traceOptions = [
  {
    type: TraceType.SOLID,
    color: "rgba(0, 0, 255, .7)",
    help: "Completely impenetrable areas bodies may not pass through (but may sit on top)"
  },
  {
    type: TraceType.STAIRS,
    color: "rgba(0, 200, 0, .7)",
    help: "Wedge-shaped solid trace (direction determines from bottom to top)"
  },
  {
    type: TraceType.GROUND,
    color: TRACE_GROUND_COLOR,
    help: "Zero-height solid trace, perfect for bridges"
  },
  {
    type: TraceType.EVENT,
    color: "rgba(255, 0, 0, .7)",
    help: "Indicates area of the level which will trigger a function call when a body moves into the area"
  },
  {
    type: TraceType.PATH,
    color: "rgba(0, 0, 0, 1)",
    help: "Link positions together for walking purposes"
  },
  {
    type: TraceType.POINTER,
    color: "rgba(100, 50, 100, .8)",
    help: "Link to another level *in the same region*. Traces from that level will affect this area, and a body fully moved into the pointer trace will be transported to that level."
  },
  {
    type: TraceType.TRANSPORT,
    color: "rgba(200, 100, 10, .8)",
    help: "Link to another level regardless of what's on the other side. Note: You'll want to use opposite values for pairs of these traces, but be careful not to overlap the traces and leave enough room for the maximum expected base between."
  },
  {
    type: TraceType.SEND,
    color: "rgba(200, 100, 200, .8)",
    help: "Similar to transport trace, transport body to another location. Unlike transport trace, send trace will always send to a single absolute location."
  }
]

export const collageTraceOptions = traceOptions.filter(
  o => ![
    TraceType.PATH,
    TraceType.POINTER,
    TraceType.TRANSPORT,
  ].includes(o.type)
)
