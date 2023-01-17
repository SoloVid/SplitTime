import { Coordinates3D } from "engine/world/level/level-location"
import { EventTraceInfo, PointerTraceInfo, SolidCollisionInfo, Traces2 } from "engine/world/level/level-traces2"
import { Trace } from "engine/world/level/trace/trace"
import { TraceSpec } from "engine/world/level/trace/trace-spec"
import { TraceType } from "engine/world/level/trace/trace-type"
import { Trace as FileDataTrace } from "../../../engine/world/level/level-file-data"
import { makeTrace as makeTraceProper } from "../../../engine/world/level/level-file-data-helpers"

export const width = 30
export const length = 30
export const height = 30

const largeSquareVertices = "(10, 10) (10, 20) (20, 20) (20, 10) (close)"
export const largeCube = {
    trace: makeTrace({
        type: TraceType.SOLID,
        vertices: largeSquareVertices,
        z: 10,
        height: 10
    }),
    overlaps: function(coords: Coordinates3D) {
        return coords.x >= 10 && coords.x <= 20
            && coords.y >= 10 && coords.y <= 20
            && coords.z >= 10 && coords.z <= 20
    }
}

const smallSquareVertices = "(10, 10) (10, 15) (15, 15) (15, 10) (close)"
export const smallCube = {
    trace: makeTrace({
        type: TraceType.SOLID,
        vertices: smallSquareVertices,
        z: 15,
        height: 5
    }),
    overlaps: function(coords: Coordinates3D) {
        return coords.x >= 10 && coords.x <= 15
            && coords.y >= 10 && coords.y <= 15
            && coords.z >= 15 && coords.z <= 20
    }
}

export const stairs = {
    trace: makeTrace({
        type: TraceType.STAIRS,
        vertices: largeSquareVertices,
        z: 10,
        height: 10,
        direction: "E"
    }),
    overlaps: function(coords: Coordinates3D) {
        return largeCube.overlaps(coords)
            // As x increases (since E), stair steps up
            && coords.z <= coords.x
    }
}

const groundPoints = "(0, 0) (0, 30) (30, 30) (30, 0) (close)"
export const ground = {
    trace: makeTrace({
        type: TraceType.SOLID,
        vertices: groundPoints,
        z: 15,
        height: 0
    }),
    overlaps: function(coords: Coordinates3D) {
        return coords.z === 15
    }
}

const pointer1Vertices = "(12, 12) (12, 21) (21, 21) (21, 12) (close)"
export const pointer1 = {
    trace: makeTrace({
        type: TraceType.POINTER,
        vertices: pointer1Vertices,
        z: 12,
        height: 9,
        level: "pointer1-level",
        offsetX: 1,
        offsetY: 1,
        offsetZ: 1
    }),
    overlaps: function(coords: Coordinates3D) {
        return coords.x >= 12 && coords.x <= 21
            && coords.y >= 12 && coords.y <= 21
            && coords.z >= 12 && coords.z < 21
    }
}

// We want this second one to overlap with the first
const pointer2Vertices = "(16, 16) (16, 24) (24, 24) (24, 16) (close)"
export const pointer2 = {
    trace: makeTrace({
        type: TraceType.POINTER,
        vertices: pointer2Vertices,
        z: 12,
        height: 9,
        level: "pointer2-level",
        offsetX: 2,
        offsetY: 2,
        offsetZ: 2
    }),
    overlaps: function(coords: Coordinates3D) {
        return coords.x >= 16 && coords.x <= 24
            && coords.y >= 16 && coords.y <= 24
            && coords.z >= 12 && coords.z < 21
    }
}

// Also trying to make this one overlap
const eventVertices = "(14, 14) (14, 17) (17, 17) (17, 14) (close)"
export const eventId = "test-event"
export const eventBox = {
    trace: makeTrace({
        type: TraceType.EVENT,
        vertices: eventVertices,
        z: 14,
        height: 3,
        event: eventId
    }),
    overlaps: function(coords: Coordinates3D) {
        return coords.x >= 14 && coords.x <= 17
            && coords.y >= 14 && coords.y <= 17
            && coords.z >= 14 && coords.z < 17
    }
}

interface ConglomerateCollisionInfo {
    solid: SolidCollisionInfo
    pointerOffsets: PointerTraceInfo
    events: EventTraceInfo
}

export function testTraces(
    traces: Trace[],
    pointCallback: (coords: Coordinates3D, collisionInfo: ConglomerateCollisionInfo) => void
) {
    const levelTraces = new Traces2(traces, width, length)
    forAllPixels(coords => {
        const solidCollisionInfo = new SolidCollisionInfo({lowestLayerZ: 0})
        levelTraces.calculateVolumeSolidCollision(solidCollisionInfo, coords.x, 1, coords.y, 1, coords.z, coords.z + 1)
        const pointers = {}
        levelTraces.calculateVolumePointers(pointers, coords.x, 1, coords.y, 1, coords.z, coords.z + 1)
        const events = {}
        levelTraces.calculateVolumeEvents(events, coords.x, 1, coords.y, 1, coords.z, coords.z + 1)
        pointCallback(coords, {
            solid: solidCollisionInfo,
            pointerOffsets: pointers,
            events: events
        })
    })
}

export function coordsStr(coords: Coordinates3D) {
    return "(" + coords.x + ", " + coords.y + ", " + coords.z + ")"
}

export function forAllPixels(callback: (coords: Coordinates3D) => void) {
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < length; y++) {
            for (let z = 0; z < height; z++) {
                callback({
                    x: x,
                    y: y,
                    z: z
                })
            }
        }
    }
}

export function makeTrace(partialTrace: Partial<FileDataTrace>): Trace {
    const spec = TraceSpec.fromRaw(makeTraceProper(partialTrace))
    return new Trace(spec)
}
