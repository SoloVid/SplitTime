namespace splitTime.level {
    const levelTracesTests = {}
    splitTime.test.group(levelTracesTests, "Level Traces Tests", level)

    // This test covers the most volume we use to check collisions,
    // but we're keeping this plane-checking testing to a minimum
    // because it is a little more unwieldy for the complicated cases later.
    splitTime.test.scenario(levelTracesTests, "Plane collisions with cube", t => {
        var levelTraces = new Traces([largeCube.trace], width, length)

        // x by x
        for (let x = 0; x < width; x++) {
            const collisionInfo = new traces.CollisionInfo()
            levelTraces.calculateVolumeCollision(collisionInfo, x, 1, 0, length, 0, height)
            const coordsStr = "x = " + x
            if (x < 10 || x > 20) {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
            } else {
                t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
            }
        }

        // y by y
        for (let y = 0; y < length; y++) {
            const collisionInfo = new traces.CollisionInfo()
            levelTraces.calculateVolumeCollision(collisionInfo, 0, width, y, 1, 0, height)
            const coordsStr = "y = " + y
            if (y < 10 || y > 20) {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
            } else {
                t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
            }
        }

        // z by z
        for (let z = 0; z < height; z++) {
            const collisionInfo = new traces.CollisionInfo()
            levelTraces.calculateVolumeCollision(collisionInfo, 0, width, 0, length, z, z + 1)
            const coordsStr = "z = " + z
            if (z < 10 || z > 20) {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
            } else {
                t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
            }
        }
    })

    // Cover the basics with just points. This should be basically
    // the same as the previous (plane-based) test but verify that
    // the collisions are detected the same when looking at each point.
    splitTime.test.scenario(levelTracesTests, "Point collisions with cube", t => {
        testTraces([largeCube.trace], (coords, collisionInfo) => {
            if (largeCube.overlaps(coords)) {
                t.assert(collisionInfo.containsSolid, "We should be colliding at " + coordsStr(coords))
            } else {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
            }
        })
    })

    // Stairs are complicated, so this is a simple test to check they generally work OK
    splitTime.test.scenario(levelTracesTests, "Collisions with stairs", t => {
        testTraces([stairs.trace], (coords, collisionInfo) => {
            if (stairs.overlaps(coords)) {
                t.assert(collisionInfo.containsSolid, "We should be colliding at " + coordsStr(coords))
            } else {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
            }
        })
    })

    // This test combines stuff to make sure auto-layer-splitting stuff works properly,
    // particularly with stairs being split across layers
    splitTime.test.scenario(levelTracesTests, "Collisions with stairs and cube", t => {
        testTraces([stairs.trace, smallCube.trace], (coords, collisionInfo) => {
            if (smallCube.overlaps(coords) || stairs.overlaps(coords)) {
                t.assert(collisionInfo.containsSolid, "We should be colliding at " + coordsStr(coords))
            } else {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
            }
        })
    })

    // This test is intended to cover some ground (pun intended)
    splitTime.test.scenario(levelTracesTests, "Collisions with ground trace", t => {
        testTraces([ground.trace], (coords, collisionInfo) => {
            if (ground.overlaps(coords)) {
                t.assert(collisionInfo.containsSolid, "We should be colliding at " + coordsStr(coords))
            } else {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
            }
        })
    })

    // This test is intended to cover ground mixed with other stuff
    splitTime.test.scenario(levelTracesTests, "Collisions with ground and cube", t => {
        testTraces([largeCube.trace, ground.trace], (coords, collisionInfo) => {
            if (largeCube.overlaps(coords) || ground.overlaps(coords)) {
                t.assert(collisionInfo.containsSolid, "We should be colliding at " + coordsStr(coords))
            } else {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
            }
        })
    })

    splitTime.test.scenario(levelTracesTests, "Pointer trace", t => {
        testTraces([pointer1.trace], (coords, collisionInfo) => {
            t.assert(!collisionInfo.containsSolid, "Pointer trace should not be solid at " + coordsStr(coords))
            const levels = collisionInfo.levels
            const pointerTraces = collisionInfo.pointerTraces
            // There should be no more than one here because we're checking
            // one pixel and there is one pointer trace.
            // FTODO: Is this a problem that it could be 0 or 1?
            // The zero case seems to come from referencing coordinates that are
            // undefined according to the traces specified.
            t.assert(Object.keys(levels).length <= 1, "Should be no more than one level at " + coordsStr(coords))
            if (pointer1.overlaps(coords)) {
                t.assert(Object.keys(pointerTraces).length === 1, "Should be one pointer at " + coordsStr(coords))
                t.assert(pointer1Level === levels[pointer1Level.id], "Expecting pointer1 level at " + coordsStr(coords))
                const actualTrace = pointerTraces[pointer1Level.id]
                t.assert(pointer1.trace === actualTrace, "Expecting pointer1 level trace at " + coordsStr(coords))
            } else {
                t.assert(Object.keys(pointerTraces).length === 0, "Should be no pointer at " + coordsStr(coords))
            }
        })
    })

    splitTime.test.scenario(levelTracesTests, "Event trace", t => {
        testTraces([eventBox.trace], (coords, collisionInfo) => {
            t.assert(!collisionInfo.containsSolid, "Event trace should not be solid at " + coordsStr(coords))
            const events = collisionInfo.events
            if (eventBox.overlaps(coords)) {
                t.assert(Object.keys(events).length === 1, "Should be one event at " + coordsStr(coords))
                t.assert(!!events[eventId], "Expecting specific event at " + coordsStr(coords))
                // FTODO: test ZRange?
            } else {
                t.assert(Object.keys(events).length === 0, "Should be no event at " + coordsStr(coords))
            }
        })
    })

    splitTime.test.scenario(levelTracesTests, "Overlapping traces", t => {
        let demonstratedOverlappingPointers = false
        let demonstratedOverlappingEvent = false
        let demonstratedOverlappingSolid = false
        let demonstratedOverlappingAll = false
        testTraces([smallCube.trace, pointer1.trace, pointer2.trace, eventBox.trace],
            (coords, collisionInfo) => {
                t.assert(smallCube.overlaps(coords) === collisionInfo.containsSolid,
                    "Should be solid at " + coordsStr(coords))
                t.assert(pointer1.overlaps(coords) === !!collisionInfo.pointerTraces[pointer1Level.id],
                    "Should be pointer1 at " + coordsStr(coords))
                t.assert(pointer2.overlaps(coords) === !!collisionInfo.pointerTraces[pointer2Level.id],
                    "Should be pointer2 at " + coordsStr(coords))
                t.assert(eventBox.overlaps(coords) === !!collisionInfo.events[eventId],
                    "Should be event at " + coordsStr(coords))

                if (pointer1.overlaps(coords) && pointer2.overlaps(coords)) {
                    demonstratedOverlappingPointers = true
                }
                if (eventBox.overlaps(coords) && (
                        smallCube.overlaps(coords) || pointer1.overlaps(coords) || pointer2.overlaps(coords)
                    )
                ) {
                    demonstratedOverlappingEvent = true
                }
                if (smallCube.overlaps(coords) && (
                        eventBox.overlaps(coords) || pointer1.overlaps(coords) || pointer2.overlaps(coords)
                    )
                ) {
                    demonstratedOverlappingSolid = true
                }
                if (
                    smallCube.overlaps(coords)
                    && (pointer1.overlaps(coords) || pointer2.overlaps(coords))
                    && eventBox.overlaps(coords)
                ) {
                    demonstratedOverlappingAll = true
                }
            }
        )
        assert(demonstratedOverlappingPointers, "Test should demonstrate overlapping pointers")
        assert(demonstratedOverlappingEvent, "Test should demonstrate overlapping event")
        assert(demonstratedOverlappingSolid, "Test should demonstrate overlapping solid")
        assert(demonstratedOverlappingAll, "Test should demonstrate overlapping all types")
    })

    const width = 30
    const length = 30
    const height = 30

    const largeSquareVertices = "(10, 10) (10, 20) (20, 20) (20, 10) (close)"
    const largeCube = {
        trace: makeTrace(trace.Type.SOLID, largeSquareVertices, 10, 10),
        overlaps: function(coords: Coordinates3D) {
            return coords.x >= 10 && coords.x <= 20
                && coords.y >= 10 && coords.y <= 20
                && coords.z >= 10 && coords.z <= 20
        }
    }

    const smallSquareVertices = "(10, 10) (10, 15) (15, 15) (15, 10) (close)"
    const smallCube = {
        trace: makeTrace(trace.Type.SOLID, smallSquareVertices, 15, 5),
        overlaps: function(coords: Coordinates3D) {
            return coords.x >= 10 && coords.x <= 15
                && coords.y >= 10 && coords.y <= 15
                && coords.z >= 15 && coords.z <= 20
        }
    }

    const stairs = {
        trace: makeTrace(trace.Type.STAIRS, largeSquareVertices, 10, 10),
        overlaps: function(coords: Coordinates3D) {
            return largeCube.overlaps(coords)
                // As x increases (since E), stair steps up
                && coords.z <= coords.x
        }
    }
    stairs.trace.spec.direction = direction.interpret("E")

    const groundPoints = "(0, 0) (0, 30) (30, 30) (30, 0) (close)"
    const ground = {
        trace: makeTrace(trace.Type.SOLID, groundPoints, 15, 0),
        overlaps: function(coords: Coordinates3D) {
            return coords.z === 15
        }
    }

    const dummyFileData: splitTime.level.FileData = {
        fileName: "file",
        type: "action",
        region: "region",
        width: width,
        height: height,
        background: "background",
        backgroundOffsetX: 0,
        backgroundOffsetY: 0,
        traces: [],
        props: [],
        positions: []
    }

    const pointer1Vertices = "(12, 12) (12, 21) (21, 21) (21, 12) (close)"
    const pointer1 = {
        trace: makeTrace(trace.Type.POINTER, pointer1Vertices, 12, 9),
        overlaps: function(coords: Coordinates3D) {
            return coords.x >= 12 && coords.x <= 21
                && coords.y >= 12 && coords.y <= 21
                && coords.z >= 12 && coords.z < 21
        }
    }
    const pointer1Level = new splitTime.Level("pointer1-level", dummyFileData)
    pointer1.trace.level = pointer1Level
    pointer1.trace.offsetX = 1
    pointer1.trace.offsetX = 1
    pointer1.trace.offsetX = 1

    // We want this second one to overlap with the first
    const pointer2Vertices = "(16, 16) (16, 24) (24, 24) (24, 16) (close)"
    const pointer2 = {
        trace: makeTrace(trace.Type.POINTER, pointer1Vertices, 16, 8),
        overlaps: function(coords: Coordinates3D) {
            return coords.x >= 16 && coords.x <= 24
                && coords.y >= 16 && coords.y <= 24
                && coords.z >= 16 && coords.z < 24
        }
    }
    const pointer2Level = new splitTime.Level("pointer2-level", dummyFileData)
    pointer2.trace.level = pointer2Level
    pointer2.trace.offsetX = 2
    pointer2.trace.offsetX = 2
    pointer2.trace.offsetX = 2

    // Also trying to make this one overlap
    const eventVertices = "(14, 14) (14, 17) (17, 17) (17, 14) (close)"
    const eventBox = {
        trace: makeTrace(trace.Type.EVENT, eventVertices, 14, 3),
        overlaps: function(coords: Coordinates3D) {
            return coords.x >= 14 && coords.x <= 17
                && coords.y >= 14 && coords.y <= 17
                && coords.z >= 14 && coords.z < 17
        }
    }
    const eventId = "test-event"
    eventBox.trace.spec.eventId = eventId

    function testTraces(
        traces: Trace[],
        pointCallback: (coords: Coordinates3D, collisionInfo: traces.CollisionInfo) => void
    ) {
        const levelTraces = new Traces(traces, width, length)
        forAllPixels(coords => {
            const collisionInfo = new splitTime.level.traces.CollisionInfo()
            levelTraces.calculateVolumeCollision(collisionInfo, coords.x, 1, coords.y, 1, coords.z, coords.z + 1)
            pointCallback(coords, collisionInfo)
        })
    }

    function coordsStr(coords: Coordinates3D) {
        return "(" + coords.x + ", " + coords.y + ", " + coords.z + ")"
    }

    function forAllPixels(callback: (coords: Coordinates3D) => void) {
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

    function makeTrace(type: string, points: string, z: number, height: number): Trace {
        const t = new Trace(new trace.TraceSpec(type, points))
        t.spec.z = z
        t.spec.height = height
        return t
    }
}