namespace splitTime.body.collisions {
    class CollisionInfo {
        x: int = -1
        y: int = -1
        body: Body | null = null
        // positive number
        distanceAllowed: number = SLVD.MAX_SAFE_INTEGER
        zBlocked: int = -1
        events: string[] = []
        otherLevels: string[] = []
    }

    export class Falling {
        mover: Mover
        constructor(mover: splitTime.body.Mover) {
            this.mover = mover
        }
        /**
         * @param {number} maxDZ (positive)
         * @returns {number} Z pixels moved (non-positive)
         */
        zeldaVerticalDrop(maxDZ: number): number {
            var collisionInfo = this.calculateDrop(maxDZ)
            var levelIdSet = {}

            this.mover.body.setZ(collisionInfo.zBlocked)
            this.mover.bodyExt.previousGroundBody = collisionInfo.body
            this.mover.bodyExt.previousGroundTraceX = collisionInfo.x
            this.mover.bodyExt.previousGroundTraceY = collisionInfo.y
            this.mover.bodyExt.previousGroundTraceZ = collisionInfo.zBlocked
            if (collisionInfo.x >= 0) {
                this.mover.body.level.runEvents(
                    collisionInfo.events,
                    this.mover.body
                )
            }

            //If we have entered a new level by falling into it
            if (collisionInfo.otherLevels.length > 0) {
                addArrayToSet(collisionInfo.otherLevels, levelIdSet)
                this.mover.transportLevelIfApplicable(levelIdSet)
            }

            return -collisionInfo.distanceAllowed
        }

        /**
         * @param maxDZ (positive)
         */
        calculateDrop(maxDZ: number): CollisionInfo {
            var roundX = Math.floor(this.mover.body.getX())
            var roundY = Math.floor(this.mover.body.getY())
            var z = this.mover.body.getZ()
            var targetZ = z - maxDZ
            var collisionInfo = new CollisionInfo()
            collisionInfo.distanceAllowed = maxDZ
            collisionInfo.zBlocked = targetZ

            var groundBody = this.mover.bodyExt.previousGroundBody
            if (groundBody && this.isStandingOnBody()) {
                collisionInfo.body = groundBody
                return collisionInfo
            }
            if (this.mover.body.z <= 0) {
                collisionInfo.x = roundX
                collisionInfo.y = roundY
                collisionInfo.distanceAllowed = 0
                collisionInfo.zBlocked = 0
                return collisionInfo
            }
            if (this.isPreviousGroundTraceRelevant()) {
                collisionInfo.x = this.mover.bodyExt.previousGroundTraceX
                collisionInfo.y = this.mover.bodyExt.previousGroundTraceY
                collisionInfo.distanceAllowed = 0
                collisionInfo.zBlocked = this.mover.bodyExt.previousGroundTraceZ
                return collisionInfo
            }

            var collisionInfoBodies = this.calculateDropThroughBodies(
                roundX,
                roundY,
                z,
                maxDZ
            )

            var collisionInfoTraces = this.calculateDropThroughTraces(
                roundX,
                roundY,
                z,
                collisionInfoBodies.distanceAllowed
            )

            if (
                collisionInfoTraces.distanceAllowed <
                collisionInfoBodies.distanceAllowed
            ) {
                collisionInfo.x = collisionInfoTraces.x
                collisionInfo.y = collisionInfoTraces.y
                collisionInfo.distanceAllowed =
                    collisionInfoTraces.distanceAllowed
                collisionInfo.zBlocked = collisionInfoTraces.zBlocked
                collisionInfo.events = collisionInfoTraces.events
                collisionInfo.otherLevels = collisionInfoTraces.otherLevels
            } else {
                collisionInfo.body = collisionInfoBodies.body
                collisionInfo.distanceAllowed =
                    collisionInfoBodies.distanceAllowed
                collisionInfo.zBlocked = collisionInfoBodies.zBlocked
            }

            return collisionInfo
        }

        /**
         * @param maxDZ (positive)
         */
        calculateDropThroughTraces(
            x: int,
            y: int,
            z: number,
            maxDZ: number
        ): CollisionInfo {
            var targetZ = z - maxDZ
            var collisionInfo = new CollisionInfo()
            collisionInfo.distanceAllowed = maxDZ
            collisionInfo.zBlocked = targetZ

            var startX = x - this.mover.body.halfBaseLength
            var xPixels = this.mover.body.baseLength
            var startY = y - this.mover.body.halfBaseLength
            var yPixels = this.mover.body.baseLength

            if (z <= 0) {
                collisionInfo.distanceAllowed = 0
                collisionInfo.zBlocked = 0
                return collisionInfo
            } else if (targetZ <= 0) {
                collisionInfo.distanceAllowed = z
                collisionInfo.zBlocked = 0
            }

            var levelTraces = this.mover.body.level.getLevelTraces()
            var originCollisionInfo = new splitTime.level.traces.CollisionInfo()
            //Loop through Y width of base
            for (var testY = startY; testY < startY + yPixels; testY++) {
                //Loop through X width of base
                for (var testX = startX; testX < startX + xPixels; testX++) {
                    levelTraces.calculatePixelColumnCollisionInfo(
                        originCollisionInfo,
                        testX,
                        testY,
                        targetZ,
                        z + 1
                    )

                    //If we have entered a new level by falling into it
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
                            collisionInfo.zBlocked <
                                originCollisionInfo.zBlockedTopEx
                        ) {
                            collisionInfo.x = testX
                            collisionInfo.y = testY
                            collisionInfo.distanceAllowed =
                                z - originCollisionInfo.zBlockedTopEx
                            collisionInfo.zBlocked =
                                originCollisionInfo.zBlockedTopEx

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
                if (zRange.exMaxZ > originCollisionInfo.zBlockedTopEx) {
                    collisionInfo.events.push(funcId)
                }
            }

            // Make sure we don't go up
            if (collisionInfo.distanceAllowed < 0) {
                collisionInfo.distanceAllowed = 0
            }
            if (collisionInfo.zBlocked > z) {
                collisionInfo.zBlocked = z
            }

            return collisionInfo
        }

        /**
         * @param {number} maxDZ (positive)
         */
        calculateDropThroughBodies(
            x: int,
            y: int,
            z: number,
            maxDZ: number
        ): CollisionInfo {
            var targetZ = z - maxDZ
            var collisionInfo = new CollisionInfo()
            collisionInfo.distanceAllowed = maxDZ
            collisionInfo.zBlocked = targetZ

            var startX = x - this.mover.body.halfBaseLength
            var xPixels = this.mover.body.baseLength
            var startY = y - this.mover.body.halfBaseLength
            var yPixels = this.mover.body.baseLength

            if (z <= 0) {
                collisionInfo.distanceAllowed = 0
                collisionInfo.zBlocked = 0
                return collisionInfo
            } else if (targetZ <= 0) {
                collisionInfo.distanceAllowed = z
                collisionInfo.zBlocked = 0
            }

            function handleFoundBody(otherBody: Body) {
                var zBlocked = otherBody.getZ() + otherBody.height
                if (
                    zBlocked > collisionInfo.zBlocked &&
                    zBlocked - otherBody.height / 2 <= z
                ) {
                    collisionInfo.body = otherBody
                    collisionInfo.distanceAllowed = z - zBlocked
                    collisionInfo.zBlocked = zBlocked
                }
            }
            this.mover.body.level
                .getCellGrid()
                .forEachBody(
                    startX,
                    startY,
                    targetZ,
                    startX + xPixels,
                    startY + yPixels,
                    z,
                    handleFoundBody
                )

            return collisionInfo
        }

        isStandingOnBody() {
            return false
            // TODO
            // Check for perfect groundBody.z + groundBody.height === standingBody.z
            // Then check for horizontal overlap of bases
        }

        isPreviousGroundTraceRelevant() {
            if (this.mover.bodyExt.previousGroundTraceX >= 0) {
                var roundX = Math.floor(this.mover.body.getX())
                var roundY = Math.floor(this.mover.body.getY())
                var startX = roundX - this.mover.body.halfBaseLength
                var xPixels = this.mover.body.baseLength
                var startY = roundY - this.mover.body.halfBaseLength
                var yPixels = this.mover.body.baseLength
                return (
                    this.mover.body.z ===
                        this.mover.bodyExt.previousGroundTraceZ &&
                    startX <= this.mover.bodyExt.previousGroundTraceX &&
                    this.mover.bodyExt.previousGroundTraceX <
                        startX + xPixels &&
                    startY <= this.mover.bodyExt.previousGroundTraceY &&
                    this.mover.bodyExt.previousGroundTraceY < startY + yPixels
                )
            }
            return false
        }
    }
}
