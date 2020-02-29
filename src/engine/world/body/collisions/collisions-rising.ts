namespace splitTime.body.collisions {
    var ZILCH = 0.00001

    class CollisionInfo {
        x: int = -1
        y: int = -1
        body: Body | null = null
        distanceAllowed: number
        zBlocked: int
        zEnd: int
        events: string[] = []
        otherLevels: string[] = []

        constructor(distanceAllowed: number, zBlocked: int, zEnd: int) {
            this.distanceAllowed = distanceAllowed
            this.zBlocked = zBlocked
            this.zEnd = zEnd
        }
    }

    export class Rising {
        constructor(private readonly mover: splitTime.body.Mover) {}

        /**
         * @param {number} maxDZ (positive)
         * @returns {number} Z pixels moved (non-negative)
         */
        zeldaVerticalRise(maxDZ: number): number {
            var collisionInfo = this.calculateRise(maxDZ)
            var levelIdSet = {}

            this.mover.body.setZ(collisionInfo.zEnd)
            if (collisionInfo.x >= 0) {
                this.mover.body.level.runEvents(
                    collisionInfo.events,
                    this.mover.body
                )
            }
            if (collisionInfo.body && collisionInfo.distanceAllowed < maxDZ) {
                var howMuchUnmoved = maxDZ - collisionInfo.distanceAllowed
                var howFarToPushOther = Math.min(howMuchUnmoved, 1)
                collisionInfo.body.mover.rising.zeldaVerticalRise(
                    howFarToPushOther
                )
                var howMuchMoreICanMove = howMuchUnmoved - howFarToPushOther * 2
                if (howMuchMoreICanMove > 0) {
                    return this.zeldaVerticalRise(howMuchMoreICanMove)
                }
            }
            if (
                collisionInfo.distanceAllowed > ZILCH &&
                this.mover.body.zVelocity < 0
            ) {
                this.mover.body.zVelocity = 0
            }

            //If we have entered a new level by falling into it
            if (collisionInfo.otherLevels.length > 0) {
                addArrayToSet(collisionInfo.otherLevels, levelIdSet)
                this.mover.transportLevelIfApplicable(levelIdSet)
            }

            return collisionInfo.distanceAllowed
        }

        /**
         * @param maxDZ (positive)
         */
        calculateRise(maxDZ: number): CollisionInfo {
            var roundX = Math.floor(this.mover.body.getX())
            var roundY = Math.floor(this.mover.body.getY())
            var z = this.mover.body.getZ()
            var top = z + this.mover.body.height
            var targetZ = z + maxDZ
            var targetTop = top + maxDZ
            var collisionInfo = new CollisionInfo(maxDZ, targetTop, targetZ)

            var collisionInfoBodies = this.calculateRiseThroughBodies(
                roundX,
                roundY,
                z,
                maxDZ
            )

            var collisionInfoTraces = this.calculateRiseThroughTraces(
                roundX,
                roundY,
                z,
                collisionInfoBodies.distanceAllowed
            )

            //TODO: should this line be inside the if/else block below?
            collisionInfo.otherLevels = collisionInfoTraces.otherLevels

            if (
                collisionInfoTraces.distanceAllowed <
                collisionInfoBodies.distanceAllowed
            ) {
                collisionInfo.x = collisionInfoTraces.x
                collisionInfo.y = collisionInfoTraces.y
                collisionInfo.distanceAllowed =
                    collisionInfoTraces.distanceAllowed
                collisionInfo.zBlocked = collisionInfoTraces.zBlocked
                collisionInfo.zEnd = collisionInfoTraces.zEnd
                collisionInfo.events = collisionInfoTraces.events
            } else {
                collisionInfo.body = collisionInfoBodies.body
                collisionInfo.distanceAllowed =
                    collisionInfoBodies.distanceAllowed
                collisionInfo.zBlocked = collisionInfoBodies.zBlocked
                collisionInfo.zEnd = collisionInfoBodies.zEnd
            }

            return collisionInfo
        }

        /**
         * @param {int} x
         * @param {int} y
         * @param {number} z
         * @param {number} maxDZ (positive)
         * @returns {{x: int, y: int, distanceAllowed: number, zBlocked: number, zEnd: number, events: string[]}}
         */
        calculateRiseThroughTraces(
            x: int,
            y: int,
            z: number,
            maxDZ: number
        ): CollisionInfo {
            var top = z + this.mover.body.height
            var targetZ = z + maxDZ
            var targetTop = top + maxDZ
            var collisionInfo = new CollisionInfo(maxDZ, targetTop, targetZ)

            var startX = x - this.mover.body.halfBaseLength
            var xPixels = this.mover.body.baseLength
            var startY = y - this.mover.body.halfBaseLength
            var yPixels = this.mover.body.baseLength

            var levelTraces = this.mover.body.level.getLevelTraces()
            var originCollisionInfo = new splitTime.level.traces.CollisionInfo()
            //Loop through width of base
            for (var testY = startY; testY < startY + yPixels; testY++) {
                //Loop through height of base
                for (var testX = startX; testX < startX + xPixels; testX++) {
                    levelTraces.calculatePixelColumnCollisionInfo(
                        originCollisionInfo,
                        testX,
                        testY,
                        top,
                        targetTop
                    )

                    //If we have entered a new level
                    if (
                        Object.keys(originCollisionInfo.pointerTraces).length >
                        0
                    ) {
                        //Make sure that the pointer trace will get handled properly
                        var count = 0
                        for (var levelId in originCollisionInfo.pointerTraces) {
                            collisionInfo.otherLevels[count] = levelId
                            count++
                        }
                    }

                    if (
                        originCollisionInfo.containsSolid &&
                        originCollisionInfo.zBlockedTopEx !==
                            collisionInfo.zBlocked
                    ) {
                        if (
                            collisionInfo.zBlocked === null ||
                            collisionInfo.zBlocked >
                                originCollisionInfo.zBlockedBottom
                        ) {
                            collisionInfo.x = testX
                            collisionInfo.y = testY
                            collisionInfo.distanceAllowed =
                                originCollisionInfo.zBlockedBottom - top
                            collisionInfo.zBlocked =
                                originCollisionInfo.zBlockedBottom

                            if (collisionInfo.distanceAllowed <= 0) {
                                // TODO: break loops
                                // return true;
                            }
                        }
                    }
                }
            }

            for (var funcId in originCollisionInfo.events) {
                var zRange = originCollisionInfo.events[funcId]
                if (zRange.minZ < originCollisionInfo.zBlockedBottom) {
                    collisionInfo.events.push(funcId)
                }
            }

            // Make sure we don't go down
            if (collisionInfo.distanceAllowed < 0) {
                collisionInfo.distanceAllowed = 0
            }
            if (collisionInfo.zBlocked < top) {
                collisionInfo.zBlocked = top
            }
            collisionInfo.zEnd = collisionInfo.zBlocked - this.mover.body.height

            return collisionInfo
        }

        /**
         * @param {int} x
         * @param {int} y
         * @param {number} z
         * @param {number} maxDZ (positive)
         */
        calculateRiseThroughBodies(
            x: int,
            y: int,
            z: number,
            maxDZ: number
        ): CollisionInfo {
            var top = z + this.mover.body.height
            var targetZ = z + maxDZ
            var targetTop = top + maxDZ
            var collisionInfo = new CollisionInfo(maxDZ, targetTop, targetZ)

            var startX = x - this.mover.body.halfBaseLength
            var xPixels = this.mover.body.baseLength
            var startY = y - this.mover.body.halfBaseLength
            var yPixels = this.mover.body.baseLength

            function handleFoundBody(otherBody: Body) {
                var zBlocked = otherBody.getZ()
                if (
                    zBlocked < collisionInfo.zBlocked &&
                    zBlocked + otherBody.height / 2 >= top
                ) {
                    collisionInfo.body = otherBody
                    collisionInfo.distanceAllowed = zBlocked - top
                    collisionInfo.zBlocked = zBlocked
                }
            }
            this.mover.body.level
                .getCellGrid()
                .forEachBody(
                    startX,
                    startY,
                    top,
                    startX + xPixels,
                    startY + yPixels,
                    targetTop,
                    handleFoundBody
                )

            collisionInfo.zEnd = collisionInfo.zBlocked - this.mover.body.height

            return collisionInfo
        }
    }
}
