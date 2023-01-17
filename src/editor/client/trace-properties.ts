import { Trace } from "api/file"
import { TraceType } from "engine/world/level/trace/trace-type"
import { FieldOptions, ObjectProperties } from "./field-options"

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
}
type SimplifiedTrace = { [K in keyof Required<TraceFieldOptions>]: string | number }

export function getTracePropertiesStuff(trace: Trace, deleteCallback: () => void) {
    let fields: TraceFieldOptions = {
        id: {},
        group: {},
        type: {
            readonly: true
        },
        vertices: {},
        z: {},
        height: {}
    }

    switch(trace.type) {
        case TraceType.STAIRS:
            fields.direction = {}
            break
        case TraceType.EVENT:
            fields.event = {}
            break
        case TraceType.POINTER:
        case TraceType.TRANSPORT:
            fields.level = {}
            fields.offsetX = {}
            fields.offsetY = {}
            fields.offsetZ = {}
            break
        case TraceType.SEND:
            fields.level = {}
            fields.targetPosition = {}
            break
        }

    return {
        title: "Trace Properties",
        thing: trace as SimplifiedTrace,
        fields: fields as unknown as { [key: string]: FieldOptions },
        doDelete: deleteCallback
    }
}

export function getTracePropertiesFields(trace: Trace): { readonly [K in keyof SimplifiedTrace]?: FieldOptions } {
    let fields: TraceFieldOptions = {
        id: {},
        group: {},
        type: {
            readonly: true
        },
        vertices: {},
        z: {},
        height: {}
    }

    switch(trace.type) {
        case TraceType.STAIRS:
            fields.direction = {}
            break
        case TraceType.EVENT:
            fields.event = {}
            break
        case TraceType.POINTER:
        case TraceType.TRANSPORT:
            fields.level = {}
            fields.offsetX = {}
            fields.offsetY = {}
            fields.offsetZ = {}
            break
        case TraceType.SEND:
            fields.level = {}
            fields.targetPosition = {}
            break
        }

    return fields
}
