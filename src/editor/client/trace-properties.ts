import { Trace } from "api/file"
import { TraceType, TraceTypeType } from "engine/world/level/trace/trace-type"
import { FieldOptions, ObjectProperties } from "./field-options"
import { FileTrace } from "./file-types"
import { generateUID } from "engine/utils/misc"

interface TraceFieldOptions {
    id: FieldOptions
    group: FieldOptions
    type: FieldOptions
    vertices: FieldOptions
    z: FieldOptions
    height: FieldOptions
    direction?: FieldOptions
    event?: FieldOptions
    level?: FieldOptions
    offsetX?: FieldOptions
    offsetY?: FieldOptions
    offsetZ?: FieldOptions
    targetPosition?: FieldOptions
    color?: FieldOptions
}
type SimplifiedTrace = { [K in keyof Required<TraceFieldOptions>]: string | number }

export const tracePropertyFields = {
    id: {
        readonly: true
    },
    name: {},
    group: {},
    type: {
        readonly: true
    },
    vertices: {},
    z: {},
    height: {},
    direction: {},
    event: {},
    level: {},
    offsetX: {},
    offsetY: {},
    offsetZ: {},
    targetPosition: {},
    color: {},
    curved: {},
}

export function makeDefaultTrace(traceType: TraceTypeType): FileTrace {
    const trace: FileTrace = {
        id: generateUID(),
        name: "",
        group: "",
        type: traceType,
        vertices: "",
        z: 0,
        height: 0,
    } as const

    switch(traceType) {
        case TraceType.STAIRS:
            trace.direction = ""
            break
        case TraceType.EVENT:
            trace.event = ""
            break
        case TraceType.POINTER:
        case TraceType.TRANSPORT:
            trace.level = ""
            trace.offsetX = 0
            trace.offsetY = 0
            trace.offsetZ = 0
            break
        case TraceType.SEND:
            trace.level = ""
            trace.targetPosition = ""
            break
        case TraceType.RENDER:
            trace.color = ""
            trace.curved = true
            break
    }

    return trace
}
