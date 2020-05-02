namespace splitTime.level {
    const levelTracesTests = {}
    splitTime.test.group(levelTracesTests, "Level Traces Tests", level)

    // This test is simple and intended to cover cases of different volumes requested
    splitTime.test.scenario(levelTracesTests, "Collisions with an ordinary cube solid", t => {
        const squarePoints = "(10, 10) (10, 20) (20, 20) (20, 10) (close)"
        const cubeTrace = new Trace(Trace.Type.SOLID, squarePoints)
        cubeTrace.z = 10
        cubeTrace.height = 10

        var levelTraces = new Traces([cubeTrace], 30, 30)

        // Pixel by pixel
        for (let x = 0; x < 30; x++) {
            for (let y = 0; y < 30; y++) {
                for (let z = 0; z < 30; z++) {
                    const collisionInfo = new traces.CollisionInfo()
                    levelTraces.calculateVolumeCollision(collisionInfo, x, 1, y, 1, z, z + 1)
                    const coordsStr = "(" + x + ", " + y + ", " + z + ")"
                    if (
                        (x < 10 || x > 20)
                        || (y < 10 || y > 20)
                        || (z < 10 || z > 20)
                    ) {
                        t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
                    } else {
                        t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
                    }
                }
            }
        }

        // x by x
        for (let x = 0; x < 30; x++) {
            const collisionInfo = new traces.CollisionInfo()
            levelTraces.calculateVolumeCollision(collisionInfo, x, 1, 0, 30, 0, 30)
            const coordsStr = "x = " + x
            if (x < 10 || x > 20) {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
            } else {
                t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
            }
        }

        // y by y
        for (let y = 0; y < 30; y++) {
            const collisionInfo = new traces.CollisionInfo()
            levelTraces.calculateVolumeCollision(collisionInfo, 0, 30, y, 1, 0, 30)
            const coordsStr = "y = " + y
            if (y < 10 || y > 20) {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
            } else {
                t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
            }
        }

        // z by z
        for (let z = 0; z < 30; z++) {
            const collisionInfo = new traces.CollisionInfo()
            levelTraces.calculateVolumeCollision(collisionInfo, 0, 30, 0, 30, z, z + 1)
            const coordsStr = "z = " + z
            if (z < 10 || z > 20) {
                t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the cube at " + coordsStr)
            } else {
                t.assert(collisionInfo.containsSolid, "We should be colliding with the cube at " + coordsStr)
            }
        }
    })

    // Stairs are complicated, so this is a simple test to check they generally work OK
    splitTime.test.scenario(levelTracesTests, "Collisions with stairs work", t => {
        const stairsPoints = "(10, 10) (10, 20) (20, 20) (20, 10) (close)"
        const stairsTrace = new Trace(Trace.Type.STAIRS, stairsPoints)
        stairsTrace.z = 10
        stairsTrace.height = 10
        stairsTrace.direction = direction.interpret("E")

        var levelTraces = new Traces([stairsTrace], 30, 30)

        for (let x = 0; x < 30; x++) {
            for (let y = 0; y < 30; y++) {
                for (let z = 0; z < 30; z++) {
                    const collisionInfo = new traces.CollisionInfo()
                    levelTraces.calculateVolumeCollision(collisionInfo, x, 1, y, 1, z, z + 1)
                    const coordsStr = "(" + x + ", " + y + ", " + z + ")"
                    if (
                        (x < 10 || x > 20)
                        || (y < 10 || y > 20)
                        || (z < 10 || z > 20)
                        // As x increases (since E), stair steps up
                        || (z > x)
                    ) {
                        t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with the stairs at " + coordsStr)
                    } else {
                        t.assert(collisionInfo.containsSolid, "We should be colliding with the stairs at " + coordsStr)
                    }
                }
            }
        }
    })

    // This test combines stuff to make sure auto-layer-splitting stuff works properly,
    // particularly with stairs being split across layers
    splitTime.test.scenario(levelTracesTests, "Collisions with stairs and cube", t => {
        const squarePoints = "(10, 10) (10, 15) (15, 15) (15, 10) (close)"
        const cubeTrace = new Trace(Trace.Type.SOLID, squarePoints)
        cubeTrace.z = 15
        cubeTrace.height = 5
        const stairsPoints = "(10, 10) (10, 20) (20, 20) (20, 10) (close)"
        const stairsTrace = new Trace(Trace.Type.STAIRS, stairsPoints)
        stairsTrace.z = 10
        stairsTrace.height = 10
        stairsTrace.direction = direction.interpret("E")

        var levelTraces = new Traces([stairsTrace, cubeTrace], 30, 30)

        for (let x = 0; x < 30; x++) {
            for (let y = 0; y < 30; y++) {
                for (let z = 0; z < 30; z++) {
                    const collisionInfo = new traces.CollisionInfo()
                    levelTraces.calculateVolumeCollision(collisionInfo, x, 1, y, 1, z, z + 1)
                    const coordsStr = "(" + x + ", " + y + ", " + z + ")"
                    const isNotInCube = (x < 10 || x > 15)
                        || (y < 10 || y > 15)
                        || (z < 15 || z > 20)
                    const isNotInStairs = (x < 10 || x > 20)
                        || (y < 10 || y > 20)
                        || (z < 10 || z > 20)
                        // As x increases (since E), stair steps up
                        || (z > x)

                    if (isNotInCube && isNotInStairs) {
                        t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding at " + coordsStr)
                    } else {
                        t.assert(collisionInfo.containsSolid, "We should be colliding at " + coordsStr)
                    }
                }
            }
        }
    })

    // This test is intended to cover ground
    splitTime.test.scenario(levelTracesTests, "Collisions with ground trace", t => {
        const groundPoints = "(0, 0) (0, 30) (30, 30) (30, 0) (close)"
        const groundTrace = new Trace(Trace.Type.SOLID, groundPoints)
        groundTrace.z = 15
        groundTrace.height = 0

        // Unfortunately, the order is important here at the present
        var levelTraces = new Traces([groundTrace], 30, 30)

        // Pixel by pixel
        for (let x = 0; x < 30; x++) {
            for (let y = 0; y < 30; y++) {
                for (let z = 0; z < 30; z++) {
                    const collisionInfo = new traces.CollisionInfo()
                    levelTraces.calculateVolumeCollision(collisionInfo, x, 1, y, 1, z, z + 1)
                    const coordsStr = "(" + x + ", " + y + ", " + z + ")"
                    const isNotInGround = z !== 15
                    if (isNotInGround) {
                        t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding with ground at " + coordsStr)
                    } else {
                        t.assert(collisionInfo.containsSolid, "We should be colliding with ground at " + coordsStr)
                    }
                }
            }
        }
    })

    // This test is intended to cover ground mixed with other stuff
    splitTime.test.scenario(levelTracesTests, "Collisions with ground and cube", t => {
        const squarePoints = "(10, 10) (10, 20) (20, 20) (20, 10) (close)"
        const cubeTrace = new Trace(Trace.Type.SOLID, squarePoints)
        cubeTrace.z = 10
        cubeTrace.height = 10
        const groundPoints = "(0, 0) (0, 30) (30, 30) (30, 0) (close)"
        const groundTrace = new Trace(Trace.Type.SOLID, groundPoints)
        groundTrace.z = 15
        groundTrace.height = 0

        // Unfortunately, the order is important here at the present
        var levelTraces = new Traces([cubeTrace, groundTrace], 30, 30)

        // Pixel by pixel
        for (let x = 0; x < 30; x++) {
            for (let y = 0; y < 30; y++) {
                for (let z = 0; z < 30; z++) {
                    const collisionInfo = new traces.CollisionInfo()
                    levelTraces.calculateVolumeCollision(collisionInfo, x, 1, y, 1, z, z + 1)
                    const coordsStr = "(" + x + ", " + y + ", " + z + ")"
                    const isNotInCube = (x < 10 || x > 20)
                        || (y < 10 || y > 20)
                        || (z < 10 || z > 20)
                    const isNotInGround = z !== 15
                    if (isNotInCube && isNotInGround) {
                        t.assert(!collisionInfo.containsSolid, "We shouldn't be colliding at " + coordsStr)
                    } else {
                        t.assert(collisionInfo.containsSolid, "We should be colliding at " + coordsStr)
                    }
                }
            }
        }
    })
}