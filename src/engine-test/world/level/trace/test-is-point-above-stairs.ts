namespace splitTime.trace {
    const aboveOrBelowStairsGroup = {}

    splitTime.test.group(aboveOrBelowStairsGroup, "isPointAboveStairs()", trace)

    splitTime.test.scenario(aboveOrBelowStairsGroup, "Edge cases", t => {
        const stairs = new StairsFixture("E", 1, 5, [
            [0, 0],
            [5, 0],
            [5, 5],
            [0, 5]
        ])
        t.assert(!stairs.isPointAbove(-500, 3, 0), "Point below trace should not be above stairs")
        t.assert(stairs.isPointAbove(500, 3, 7), "Point above trace height should always be above stairs")
    })
    splitTime.test.scenario(aboveOrBelowStairsGroup, "Simple stairs", t => {
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
    splitTime.test.scenario(aboveOrBelowStairsGroup, "Simple stairs (reverse coordinate order)", t => {
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
    splitTime.test.scenario(aboveOrBelowStairsGroup, "Diagonal stairs", t => {
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

    class StairsFixture {
        private readonly spec: TraceSpec
        private readonly points: (Coordinates2D | null)[]
        constructor(
            direction: string,
            z: int,
            height: int,
            private readonly coords: CoordinateList
        ) {
            this.spec = makeSpec(coords, direction, z, height)
            this.points = this.coords.map(c => new Coordinates3D(c[0], c[1]))
            this.points.push(null)
        }

        isPointAbove(x: int, y: int, z: int): boolean {
            const pointCoord = new Coordinates3D(x, y, z)
            return isPointAboveStairs(pointCoord, this.spec, this.points)
        }
    }

    function makeSpec(coords: CoordinateList, direction: string, z: int, height: int): TraceSpec {
        const verticesStr = coords.map(c => "(" + c[0] + ", " + c[1] + ")").join(" ") + " (close)"
        const spec = new TraceSpec(Type.STAIRS, verticesStr)
        spec.direction = splitTime.direction.interpret(direction)
        spec.z = z
        spec.height = height
        return spec
    }
}