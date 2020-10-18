namespace splitTime.body.collisions {
    var ZILCH = 0.000001

    export class HorizontalCollisionInfo {
        blocked: boolean = false
        bodies: Body[] = []
        adjustedZ: number
        events: string[] = []
        targetLevel: Level | null = null

        constructor(z: number) {
            this.adjustedZ = z
        }
    }

    export class Horizontal {
        horizontalX: HorizontalX
        horizontalY: HorizontalY
        sliding: Sliding
        constructor(private readonly mover: splitTime.body.Mover) {
            this.horizontalX = new HorizontalX(mover)
            this.horizontalY = new HorizontalY(mover)
            this.sliding = new Sliding(mover)
        }
        /**
         * Advances splitTime.Body up to maxDistance pixels as far as is legal.
         * Includes pushing other Bodys out of the way
         * @returns distance actually moved
         */
        zeldaStep(dir: number, maxDistance: number, withPush: boolean = false): number {
            this.mover.ensureInRegion()
            var level = this.mover.body.level

            var dy = -maxDistance * Math.sin(dir * (Math.PI / 2)) //Total y distance to travel
            if (Math.abs(dy) < ZILCH) {
                dy = 0
            }
            var dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy)
            var ady = Math.abs(dyRounded)

            var dx = maxDistance * Math.cos(dir * (Math.PI / 2)) //Total x distance to travel
            if (Math.abs(dx) < ZILCH) {
                dx = 0
            }
            var dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx)
            var adx = Math.abs(dxRounded)

            //-1 for negative movement on the axis, 1 for positive
            var jHat = (dy === 0 ? 0 : dyRounded / ady) as unitOrZero
            var iHat = (dx === 0 ? 0 : dxRounded / adx) as unitOrZero

            var maxIterations = adx + ady
            var xPixelsRemaining = adx
            var yPixelsRemaining = ady

            var outY = false
            var stoppedY = false
            var pixelsMovedY = 0

            var outX = false
            var stoppedX = false
            var pixelsMovedX = 0

            var oldX = this.mover.body.getX()
            var oldY = this.mover.body.getY()
            var currentX = oldX
            var currentY = oldY
            var currentZ = this.mover.body.getZ()

            const halfWidth = this.mover.body.width / 2
            const halfDepth = this.mover.body.depth / 2

            var eventIdSet = {}
            let mightMoveLevels = false
            for (var i = 0; i < maxIterations; i++) {
                if (xPixelsRemaining > 0) {
                    const newX = currentX + iHat

                    //If the body is out of bounds on the x axis
                    if (
                        (iHat > 0 && newX + halfWidth >= level.width) ||
                        (iHat < 0 && newX - halfWidth < 0)
                    ) {
                        outX = true
                    } else {
                        const xCollisionInfo = this.horizontalX.calculateXPixelCollisionWithStepUp(
                            level,
                            currentX,
                            currentY,
                            currentZ,
                            iHat as unit
                        )
                        if (xCollisionInfo.blocked) {
                            stoppedX = true
                            if (withPush && xCollisionInfo.bodies.length > 0) {
                                // Slow down when pushing
                                xPixelsRemaining--
                                this.tryPushOtherBodies(
                                    xCollisionInfo.bodies,
                                    dx > 0
                                        ? splitTime.direction.E
                                        : splitTime.direction.W
                                )
                            }
                        } else {
                            currentX = newX
                            currentZ = xCollisionInfo.adjustedZ
                            xPixelsRemaining--
                            pixelsMovedX++
                            addArrayToSet(xCollisionInfo.events, eventIdSet)
                            if (xCollisionInfo.targetLevel !== level) {
                                mightMoveLevels = true
                            }
                        }
                    }
                }

                if (yPixelsRemaining > 0) {
                    const newY = currentY + jHat
                    //Check if out of bounds on the y axis
                    if (
                        (jHat > 0 && newY + halfDepth >= level.yWidth) ||
                        (jHat < 0 && newY - halfDepth < 0)
                    ) {
                        outY = true
                    } else {
                        const yCollisionInfo = this.horizontalY.calculateYPixelCollisionWithStepUp(
                            level,
                            currentX,
                            currentY,
                            currentZ,
                            jHat as unit
                        )
                        if (yCollisionInfo.blocked) {
                            stoppedY = true
                            if (withPush && yCollisionInfo.bodies.length > 0) {
                                // Slow down when pushing
                                yPixelsRemaining--
                                this.tryPushOtherBodies(
                                    yCollisionInfo.bodies,
                                    dy > 0
                                        ? splitTime.direction.S
                                        : splitTime.direction.N
                                )
                            }
                        } else {
                            currentY = newY
                            currentZ = yCollisionInfo.adjustedZ
                            yPixelsRemaining--
                            pixelsMovedY++
                            addArrayToSet(yCollisionInfo.events, eventIdSet)
                            if (yCollisionInfo.targetLevel !== level) {
                                mightMoveLevels = true
                            }
                        }
                    }
                }
            }

            if (ady > 0 && pixelsMovedY > 0) {
                var yMoved = currentY - oldY
                var newYFromSteps = oldY + yMoved
                // Subtract off overshoot
                var actualNewY = newYFromSteps - (dyRounded - dy)
                this.mover.body.setY(actualNewY)
            }
            if (adx > 0 && pixelsMovedX > 0) {
                var xMoved = currentX - oldX
                var newXFromSteps = oldX + xMoved
                // Subtract off overshoot
                var actualNewX = newXFromSteps - (dxRounded - dx)
                this.mover.body.setX(actualNewX)
            }
            this.mover.body.setZ(currentZ)

            //If stopped, help person out by sliding around corner
            var stopped = stoppedX || stoppedY
            var out = outX || outY
            if (
                stopped &&
                !out &&
                pixelsMovedX + pixelsMovedY < maxDistance / 2
            ) {
                this.sliding.zeldaSlide(maxDistance / 2)
            }

            this.mover.body.level.runEvents(Object.keys(eventIdSet), this.mover.body)
            if (mightMoveLevels) {
                this.mover.transportLevelIfApplicable()
            }

            return splitTime.measurement.distanceTrue(
                oldX,
                oldY,
                this.mover.body.getX(),
                this.mover.body.getY()
            )
        }

        tryPushOtherBodies(bodies: Body[], dir: number) {
            this.mover.bodyExt.pushing = true
            for (var i = 0; i < bodies.length; i++) {
                bodies[i].mover.zeldaBump(1, dir)
            }
            this.mover.bodyExt.pushing = false
        }
    }
}
