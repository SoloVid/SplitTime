import { makeTrace } from "../../../../engine/world/level/level-file-data-helpers"
import { Coordinates2D, Coordinates3D } from "../../../../engine/world/level/level-location"
import { Type } from "../../../../engine/world/level/trace/trace-misc"
import { TraceSpec } from "../../../../engine/world/level/trace/trace-spec"
import { StairsPlane } from "../../../../engine/world/level/trace/trace-stairs-helper"
import { int } from "../../../../globals"
import { trace } from "./test-trace"

const aboveOrBelowStairsGroup = trace.group("isPointAboveStairs()")

class StairsFixture {
    private readonly spec: TraceSpec
    private readonly points: (Coordinates2D | null)[]
    private readonly stairsPlane: StairsPlane
    constructor(
        direction: string,
        z: int,
        height: int,
        private readonly coords: CoordinateList
    ) {
        this.spec = makeSpec(coords, direction, z, height)
        this.points = this.coords.map(c => new Coordinates3D(c[0], c[1]))
        this.points.push(null)
        this.stairsPlane = new StairsPlane(this.spec, this.points)
    }

    isPointAbove(x: int, y: int, z: int): boolean {
        const pointCoord = new Coordinates3D(x, y, z)
        return this.stairsPlane.isPointAboveStairs(pointCoord)
    }
}

aboveOrBelowStairsGroup.scenario("Edge cases", t => {
    const stairs = new StairsFixture("E", 1, 5, [
        [0, 0],
        [5, 0],
        [5, 5],
        [0, 5]
    ])
    t.assert(!stairs.isPointAbove(-500, 3, 0), "Point below trace should not be above stairs")
    t.assert(stairs.isPointAbove(500, 3, 7), "Point above trace height should always be above stairs")
})
aboveOrBelowStairsGroup.scenario("Simple stairs", t => {
    const stairs = new StairsFixture("E", 1, 5, [
        [0, 0],
        [5, 0],
        [5, 5],
        [0, 5]
    ])
    t.assert(!stairs.isPointAbove(3, 3, 0), "(3, 3, 0) should not be above stairs")
    t.assert(!stairs.isPointAbove(3, 3, 1), "(3, 3, 1) should not be above stairs")
    t.assert(!stairs.isPointAbove(3, 3, 2), "(3, 3, 2) should not be above stairs")
    t.assert(!stairs.isPointAbove(3, 3, 3), "(3, 3, 3) should not be above stairs")
    t.assert(stairs.isPointAbove(3, 3, 4), "(3, 3, 4) should be above stairs")
    t.assert(stairs.isPointAbove(3, 3, 5), "(3, 3, 5) should be above stairs")
})
aboveOrBelowStairsGroup.scenario("Simple stairs (reverse coordinate order)", t => {
    const stairs = new StairsFixture("E", 1, 5, [
        [0, 0],
        [5, 0],
        [5, 5],
        [0, 5]
    ].reverse() as CoordinateList)
    t.assert(!stairs.isPointAbove(3, 3, 0), "(3, 3, 0) should not be above stairs")
    t.assert(!stairs.isPointAbove(3, 3, 1), "(3, 3, 1) should not be above stairs")
    t.assert(!stairs.isPointAbove(3, 3, 2), "(3, 3, 2) should not be above stairs")
    t.assert(!stairs.isPointAbove(3, 3, 3), "(3, 3, 3) should not be above stairs")
    t.assert(stairs.isPointAbove(3, 3, 4), "(3, 3, 4) should be above stairs")
    t.assert(stairs.isPointAbove(3, 3, 5), "(3, 3, 5) should be above stairs")
})
aboveOrBelowStairsGroup.scenario("Diagonal stairs", t => {
    const stairs = new StairsFixture("NE", 0, 4, [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4]
    ])
    // Center
    t.assert(stairs.isPointAbove(2, 2, 2), "(2, 2, 2) should be above stairs")
    // Left
    t.assert(stairs.isPointAbove(0, 2, 2), "(0, 2, 2) should be above stairs")
    // Right
    t.assert(!stairs.isPointAbove(4, 2, 2), "(4, 2, 2) should not be above stairs")
    // Up
    t.assert(!stairs.isPointAbove(2, 0, 2), "(2, 0, 2) should not be above stairs")
    // Down
    t.assert(stairs.isPointAbove(2, 4, 2), "(2, 4, 2) should be above stairs")
})

type CoordinateList = [x: int, y: int][]

function makeSpec(coords: CoordinateList, direction: string, z: int, height: int): TraceSpec {
    const verticesStr = coords.map(c => "(" + c[0] + ", " + c[1] + ")").join(" ") + " (close)"
    const specFile = makeTrace({
        type: Type.STAIRS,
        vertices: verticesStr,
        direction,
        z,
        height
    })
    return TraceSpec.fromRaw(specFile)

}
