import { makeTrace } from "../../../../engine/world/level/level-file-data-helpers"
import { Coordinates3D } from "../../../../engine/world/level/level-location"
import { Type } from "../../../../engine/world/level/trace/trace-misc"
import { TraceSpec } from "../../../../engine/world/level/trace/trace-spec"
import { calculateStairsPlane } from "../../../../engine/world/level/trace/trace-stairs-helper"
import { int } from "../../../../globals"
import { TestHelper } from "../../../../test-runner/test-helper"
import { trace } from "./test-trace"

const stairsPlaneGroup = trace.group("calculateStairsPlane()")

stairsPlaneGroup.scenario("East on square", t => {
    testStairs(t, "E", 6, [
        [0, 0, 0],
        [5, 0, 6],
        [5, 5, 6],
        [0, 5, 0]
    ])
})
stairsPlaneGroup.scenario("North on square", t => {
    testStairs(t, "N", 6, [
        [0, 0, 6],
        [5, 0, 6],
        [5, 5, 0],
        [0, 5, 0]
    ])
})
stairsPlaneGroup.scenario("West on square", t => {
    testStairs(t, "W", 6, [
        [0, 0, 6],
        [5, 0, 0],
        [5, 5, 0],
        [0, 5, 6]
    ])
})
stairsPlaneGroup.scenario("South on square", t => {
    testStairs(t, "S", 6, [
        [0, 0, 0],
        [5, 0, 0],
        [5, 5, 6],
        [0, 5, 6]
    ])
})
stairsPlaneGroup.scenario("Northeast on square", t => {
    testStairs(t, "NE", 6, [
        [0, 0, 3],
        [5, 0, 6],
        [5, 5, 3],
        [0, 5, 0]
    ])
})
stairsPlaneGroup.scenario("Northwest on square", t => {
    testStairs(t, "NW", 6, [
        [0, 0, 6],
        [5, 0, 3],
        [5, 5, 0],
        [0, 5, 3]
    ])
})
stairsPlaneGroup.scenario("Southwest on square", t => {
    testStairs(t, "SW", 6, [
        [0, 0, 3],
        [5, 0, 0],
        [5, 5, 3],
        [0, 5, 6]
    ])
})
stairsPlaneGroup.scenario("Southeast on square", t => {
    testStairs(t, "SE", 6, [
        [0, 0, 0],
        [5, 0, 3],
        [5, 5, 6],
        [0, 5, 3]
    ])
})

type CoordinateList = [x: int, y: int, z: int][]

function testStairs(t: TestHelper, direction: string, height: int, coords: CoordinateList): void {
    const spec = makeSpec(coords, direction, height)
    checkStairsPlane(t, coords, spec)
}

function makeSpec(coords: CoordinateList, direction: string, height: int): TraceSpec {
    const verticesStr = coords.map(c => "(" + c[0] + ", " + c[1] + ")").join(" ") + " (close)"
    const specFile = makeTrace({
        type: Type.STAIRS,
        vertices: verticesStr,
        direction,
        height
    })
    return TraceSpec.fromRaw(specFile)
}

function checkStairsPlane(t: TestHelper, coords: CoordinateList, spec: TraceSpec): void {
    const coordsCopy: (Coordinates3D | null)[] = coords.map(c => new Coordinates3D(c[0], c[1], c[2]))
    coordsCopy.push(null)
    const stairsPlane = calculateStairsPlane(spec, coordsCopy)
    t.assertEqual(coordsCopy.length, stairsPlane.length, "Stairs plane should have the same number of points as trace")
    for (let i = 0; i < coords.length; i++) {
        t.assertEqual(coords[i][0], stairsPlane[i].x, "x-coordinate of vertex " + i + " should match")
        t.assertEqual(coords[i][1], stairsPlane[i].y, "y-coordinate of vertex " + i + " should match")
        t.assertEqual(coords[i][2], stairsPlane[i].z, "z-coordinate of vertex " + i + " should match")
    }
}
