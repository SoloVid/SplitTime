namespace splitTime.body.collisions {
    interface VerticalCollisionInfo {
        bodies: Body[]
        events: string[]
        targetLevel: Level
        dzAllowed: number
    }

    export class Vertical {
        constructor(private readonly mover: splitTime.body.Mover) {}

        /**
         * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
         * @param {number} maxDZ
         * @returns {number} Z pixels actually moved
         */
        zeldaVerticalMove(maxDZ: number): number {
            this.mover.ensureInRegion()
            const collisionInfo = this.calculateZCollision(
                this.mover.body.level,
                this.mover.body.x,
                this.mover.body.y,
                this.mover.body.z,
                maxDZ
            )

            if (collisionInfo.dzAllowed !== 0) {
                this.mover.body.setZ(this.mover.body.z + collisionInfo.dzAllowed)
                this.mover.body.level.runEvents(collisionInfo.events, this.mover.body)
                if (collisionInfo.targetLevel !== this.mover.body.level) {
                    this.mover.transportLevelIfApplicable()
                }
            }

            return Math.abs(collisionInfo.dzAllowed)
        }

        /**
         * Check that dz can be accomplished
         */
        calculateZCollision(
            level: Level,
            x: number,
            y: number,
            z: number,
            dz: number,
            ignoreBodies: Body[] = []
        ): VerticalCollisionInfo {
            //If the body is out of bounds on the Z axis
            if (z + dz < level.lowestLayerZ) {
                dz = -(z - level.lowestLayerZ)
            }
            // log.debug("new actual: " + actualNewZ)

            const dzRoundedUp = dz > 0 ? Math.ceil(dz) : Math.floor(dz)
            const adz = Math.abs(dzRoundedUp)
            let steps = adz

            //-1 for negative movement on the axis, 1 for positive
            var kHat = (dz === 0 ? 0 : dzRoundedUp / adz) as unitOrZero

            const left = x - this.mover.body.baseLength / 2
            const top = y - this.mover.body.baseLength / 2
            const baseLength = this.mover.body.baseLength
            const height = this.mover.body.height

            // The lower bound of the collision area we'll check each iteration
            let lowerBoundZ = z + height
            // Where we are projecting to wind up
            let targetZ = z
            if (kHat === -1) {
                // We would start at z - 1 here,
                // but there is a special case for ground traces
                // which are 0-height solid traces
                lowerBoundZ = z
                targetZ = lowerBoundZ + 1
                steps += 1
            }

            let bodies: Body[] = []
            const targetLevels: { [levelId: string]: Level } = {}
            var eventIdSet = {}
            for (var i = 0; i < steps; i++) {
                const originCollisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(
                    level,
                    left, baseLength,
                    top, baseLength,
                    lowerBoundZ, 1,
                    ignoreBodies.concat(this.mover.body)
                )
                if (originCollisionInfo.blocked) {
                    bodies = originCollisionInfo.bodies
                    if (dz < 0) {
                        // Since we started targetZ above our initial point, make sure we don't go up
                        targetZ = Math.min(targetZ, z)
                        if (originCollisionInfo.zBlockedTopEx < z) {
                            targetZ = originCollisionInfo.zBlockedTopEx
                        }
                    }
                    break
                }
                lowerBoundZ += kHat
                targetZ += kHat
                addArrayToSet(originCollisionInfo.events, eventIdSet)
                targetLevels[originCollisionInfo.targetLevel.id] = originCollisionInfo.targetLevel
            }

            let dzAllowed = targetZ - z
            // If the amount we want to move is more than
            // the amount requested, go with requested
            if (Math.abs(dzAllowed) > adz) {
                dzAllowed = dz
            }

            return {
                bodies: bodies,
                events: Object.keys(eventIdSet),
                targetLevel: chooseTheOneOrDefault(targetLevels, level),
                dzAllowed: dzAllowed
            }
        }
    }
}
