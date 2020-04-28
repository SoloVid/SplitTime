namespace splitTime.body {
    export class Warper {
        level: splitTime.Level
        baseLength: number
        halfBaseLength: number
        height: number
        constructor(public readonly body: splitTime.Body) {
            this.level = body.getLevel()

            this.baseLength = this.body.baseLength
            this.halfBaseLength = Math.round(this.baseLength / 2)
            this.height = this.body.height
        }

        /**
         * Check that body is in current region
         */
        ensureInRegion() {
            // TODO: maybe reimplement?
            // if(this.body.getLevel().getRegion() !== splitTime.Region.getCurrent()) {
            //     throw new Error("Attempt to do zelda movement for body not in current region");
            // }
        }

        /**
         * Advances splitTime.Body up to maxDistance pixels as far as is legal.
         * Includes pushing other Bodys out of the way? (this part is currently unavailable)
         * @param {number} dir
         * @param {number} maxDistance
         * @returns {number} distance actually moved
         */
        warp(dir: number, maxDistance: number): number {
            this.ensureInRegion()

            var startX = Math.round(this.body.x)
            var startY = Math.round(this.body.y)
            var z = Math.round(this.body.z)
            var furthestX = Math.round(
                this.body.x +
                    maxDistance * splitTime.direction.getXMagnitude(dir)
            )
            var furthestY = Math.round(
                this.body.y +
                    maxDistance * splitTime.direction.getYMagnitude(dir)
            )

            var toX: number | null = null
            var toY: number | null = null
            var events: string[] = []
            let mightMoveLevels = false

            var me = this
            splitTime.bresenham.forEachPoint(
                furthestX,
                furthestY,
                startX,
                startY,
                (x, y) => {
                    if (
                        x + me.halfBaseLength >= me.level.width ||
                        x - me.halfBaseLength < 0
                    ) {
                        return
                    }
                    if (
                        y + me.halfBaseLength >= me.level.yWidth ||
                        y - me.halfBaseLength < 0
                    ) {
                        return
                    }
                    var collisionInfo = me._getCollisionInfoAt(x, y, z)
                    if (!collisionInfo.blocked) {
                        if (toX === null) {
                            toX = x
                            toY = y
                            events = collisionInfo.events
                            if (collisionInfo.targetLevel !== this.level) {
                                mightMoveLevels = true
                            }
                        }
                        return splitTime.bresenham.ReturnCode.EXIT_EARLY
                    }
                    return
                }
            )

            if (
                toX !== null &&
                toY !== null &&
                (Math.abs(toX - startX) > this.baseLength ||
                    Math.abs(toY - startY) > this.baseLength)
            ) {
                this.body.put(this.level, toX, toY, z)
                this.level.runEvents(events, this.body)
                if (mightMoveLevels) {
                    var transporter = new splitTime.body.Transporter(this.body)
                    transporter.transportLevelIfApplicable()
                }
                return splitTime.measurement.distanceTrue(
                    startX,
                    startY,
                    toX,
                    toY
                )
            } else {
                return 0
            }
        }

        private _getCollisionInfoAt(
            x: int,
            y: int,
            z: int
        ): { blocked: boolean; events: string[]; targetLevel: Level } {
            var left = x - this.halfBaseLength
            var top = y - this.halfBaseLength

            const originCollisionInfo =
                splitTime.COLLISION_CALCULATOR.calculateVolumeCollision(
                    this.level,
                    left,
                    this.baseLength,
                    top,
                    this.baseLength,
                    z,
                    this.body.height,
                    [this.body]
                )
            return {
                blocked: originCollisionInfo.blocked && originCollisionInfo.zBlockedTopEx !== z,
                events: originCollisionInfo.events,
                targetLevel: originCollisionInfo.targetLevel
            }
        }
    }
}
