namespace splitTime.editor.client {
    export const TRACE_GROUND_COLOR = "rgba(100, 100, 100, .5)"
    export const TRACE_GROUND_HIGHLIGHT_COLOR = "rgba(200, 200, 50, .5)"

    export const traceOptions = [
        {
            type: splitTime.trace.Type.SOLID,
            color: "rgba(0, 0, 255, .7)",
            help: "Completely impenetrable areas bodies may not pass through (but may sit on top)"
        },
        {
            type: splitTime.trace.Type.STAIRS,
            color: "rgba(0, 200, 0, .7)",
            help: "Wedge-shaped solid trace (direction determines from bottom to top)"
        },
        {
            type: splitTime.trace.Type.GROUND,
            color: TRACE_GROUND_COLOR,
            help: "Zero-height solid trace, perfect for bridges"
        },
        {
            type: splitTime.trace.Type.EVENT,
            color: "rgba(255, 0, 0, .7)",
            help: "Indicates area of the level which will trigger a function call when a body moves into the area"
        },
        {
            type: splitTime.trace.Type.PATH,
            color: "rgba(0, 0, 0, 1)",
            help: "Link positions together for walking purposes"
        },
        {
            type: splitTime.trace.Type.POINTER,
            color: "rgba(100, 50, 100, .8)",
            help: "Link to another level. Traces from that level will affect this area, and a body fully moved into the pointer trace will be transported to that level."
        },
        {
            type: splitTime.trace.Type.TRANSPORT,
            color: "rgba(200, 100, 10, .8)",
            help: "Link to another level regardless of what's on the other side. Note: You'll want to use opposite values for pairs of these traces, but be careful not to overlap the traces and leave enough room for the maximum expected base between."
        }
    ]
}