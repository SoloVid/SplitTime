import { SolidCollisionInfo, Traces2 } from "engine/world/level/level-traces2"
import { assert } from "../../../globals"
import { coordsStr, eventBox, eventId, ground, height, largeCube, length, pointer1, pointer2, smallCube, stairs, testTraces, width } from "./level-traces-fixture"
import { level } from "./test-level"

const levelTracesTests = level.group("Level Traces Tests")

// This test covers the most volume we use to check collisions,
// but we're keeping this plane-checking testing to a minimum
// because it is a little more unwieldy for the complicated cases later.
levelTracesTests.scenario("Plane collisions with cube", t => {
    var levelTraces = new Traces2([largeCube.trace], width, length)

    // x by x
    for (let x = 0; x < width; x++) {
        const collisionInfo = new SolidCollisionInfo({lowestLayerZ: 0})
        levelTraces.calculateVolumeSolidCollision(collisionInfo, x, 1, 0, length, 0, height)
        const coordsStr = "x = " + x
        if (x < 10 || x > 20) {
            t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
        } else {
            t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
        }
    }

    // y by y
    for (let y = 0; y < length; y++) {
        const collisionInfo = new SolidCollisionInfo({lowestLayerZ: 0})
        levelTraces.calculateVolumeSolidCollision(collisionInfo, 0, width, y, 1, 0, height)
        const coordsStr = "y = " + y
        if (y < 10 || y > 20) {
            t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
        } else {
            t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
        }
    }

    // z by z
    for (let z = 0; z < height; z++) {
        const collisionInfo = new SolidCollisionInfo({lowestLayerZ: 0})
        levelTraces.calculateVolumeSolidCollision(collisionInfo, 0, width, 0, length, z, z + 1)
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
levelTracesTests.scenario("Point collisions with cube", t => {
    testTraces([largeCube.trace], (coords, collisionInfo) => {
        if (largeCube.overlaps(coords)) {
            t.assert(collisionInfo.solid.containsSolid, "We should be colliding at " + coordsStr(coords))
        } else {
            t.assert(!collisionInfo.solid.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
        }
    })
})

// Stairs are complicated, so this is a simple test to check they generally work OK
levelTracesTests.scenario("Collisions with stairs", t => {
    testTraces([stairs.trace], (coords, collisionInfo) => {
        if (stairs.overlaps(coords)) {
            t.assert(collisionInfo.solid.containsSolid, "We should be colliding at " + coordsStr(coords))
        } else {
            t.assert(!collisionInfo.solid.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
        }
    })
})

// This test combines stuff to make sure auto-layer-splitting stuff works properly,
// particularly with stairs being split across layers
levelTracesTests.scenario("Collisions with stairs and cube", t => {
    testTraces([stairs.trace, smallCube.trace], (coords, collisionInfo) => {
        if (smallCube.overlaps(coords) || stairs.overlaps(coords)) {
            t.assert(collisionInfo.solid.containsSolid, "We should be colliding at " + coordsStr(coords))
        } else {
            t.assert(!collisionInfo.solid.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
        }
    })
})

// This test is intended to cover some ground (pun intended)
levelTracesTests.scenario("Collisions with ground trace", t => {
    testTraces([ground.trace], (coords, collisionInfo) => {
        if (ground.overlaps(coords)) {
            t.assert(collisionInfo.solid.containsSolid, "We should be colliding at " + coordsStr(coords))
        } else {
            t.assert(!collisionInfo.solid.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
        }
    })
})

// This test is intended to cover ground mixed with other stuff
levelTracesTests.scenario("Collisions with ground and cube", t => {
    testTraces([largeCube.trace, ground.trace], (coords, collisionInfo) => {
        if (largeCube.overlaps(coords) || ground.overlaps(coords)) {
            t.assert(collisionInfo.solid.containsSolid, "We should be colliding at " + coordsStr(coords))
        } else {
            t.assert(!collisionInfo.solid.containsSolid, "We shouldn't be colliding at " + coordsStr(coords))
        }
    })
})

levelTracesTests.scenario("Pointer trace", t => {
    testTraces([pointer1.trace], (coords, collisionInfo) => {
        t.assert(!collisionInfo.solid.containsSolid, "Pointer trace should not be solid at " + coordsStr(coords))
        const pointerOffsets = collisionInfo.pointerOffsets
        // There should be exactly one here because we're checking
        // one pixel and there is one pointer trace.
        t.assert(Object.keys(pointerOffsets).length === 1, "Should be one pointer offset at " + coordsStr(coords))
        if (pointer1.overlaps(coords)) {
            for (const id in pointerOffsets) {
                const offset = pointerOffsets[id]
                t.assert(pointer1.trace.getOffsetHash() === offset?.getOffsetHash(), "Expecting pointer1 level trace at " + coordsStr(coords))
            }
        } else {
            for (const id in pointerOffsets) {
                const offset = pointerOffsets[id]
                t.assert(offset === null, "Should be no actual pointer offset at " + coordsStr(coords))
            }
        }
    })
})

levelTracesTests.scenario("Event trace", t => {
    testTraces([eventBox.trace], (coords, collisionInfo) => {
        t.assert(!collisionInfo.solid.containsSolid, "Event trace should not be solid at " + coordsStr(coords))
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

levelTracesTests.scenario("Overlapping traces", t => {
    let demonstratedOverlappingPointers = false
    let demonstratedOverlappingEvent = false
    let demonstratedOverlappingSolid = false
    let demonstratedOverlappingAll = false
    testTraces([smallCube.trace, pointer1.trace, pointer2.trace, eventBox.trace],
        (coords, collisionInfo) => {
            t.assert(smallCube.overlaps(coords) === collisionInfo.solid.containsSolid,
                "smallCube at " + coordsStr(coords))
            t.assert(pointer1.overlaps(coords) === !!collisionInfo.pointerOffsets[pointer1.trace.getOffsetHash()],
                "pointer1 at " + coordsStr(coords))
            t.assert(pointer2.overlaps(coords) === !!collisionInfo.pointerOffsets[pointer2.trace.getOffsetHash()],
                "pointer2 at " + coordsStr(coords))
            t.assert(eventBox.overlaps(coords) === !!collisionInfo.events[eventId],
                "eventBox at " + coordsStr(coords))

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
