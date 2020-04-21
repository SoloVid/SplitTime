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

            this.mover.body.setZ(this.mover.body.z + collisionInfo.dzAllowed)
            this.mover.body.level.runEvents(collisionInfo.events, this.mover.body)
            if (collisionInfo.targetLevel !== this.mover.body.level) {
                this.mover.transportLevelIfApplicable()
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
            dz: number
        ): VerticalCollisionInfo {
            //If the body is out of bounds on the Z axis
            if (z + dz < level.lowestLayerZ) {
                dz = -(z - level.lowestLayerZ)
            }
            // log.debug("new actual: " + actualNewZ)

            const dzRoundedUp = dz > 0 ? Math.ceil(dz) : Math.floor(dz)
            const adz = Math.abs(dzRoundedUp)

            //-1 for negative movement on the axis, 1 for positive
            var kHat = (dz === 0 ? 0 : dzRoundedUp / adz) as unitOrZero

            const left = x - this.mover.body.baseLength / 2
            const top = y - this.mover.body.baseLength / 2
            const baseLength = this.mover.body.baseLength
            const height = this.mover.body.height

            let lowerBoundZ = z + height
            if (kHat === -1) {
                lowerBoundZ = z - 1
            }
            let newZ = z
            let zPixelsMoved = 0

            let bodies: Body[] = []
            const targetLevels: { [levelId: string]: Level } = {}
            var eventIdSet = {}
            for (var i = 0; i < adz; i++) {
                const originCollisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(
                    level,
                    left, baseLength,
                    top, baseLength,
                    lowerBoundZ, 1,
                    this.mover.body
                )
                if (originCollisionInfo.blocked) {
                    bodies = originCollisionInfo.bodies
                    break
                }
                zPixelsMoved++
                lowerBoundZ += kHat
                newZ += kHat
                addArrayToSet(originCollisionInfo.events, eventIdSet)
                targetLevels[originCollisionInfo.targetLevel.id] = originCollisionInfo.targetLevel
            }

            let actualNewZ = newZ
            if (zPixelsMoved > 0) {
                // Subtract off any overshoot
                actualNewZ = newZ - (dzRoundedUp - dz)
            }

            return {
                bodies: bodies,
                events: Object.keys(eventIdSet),
                targetLevel: chooseTheOneOrDefault(targetLevels, level),
                dzAllowed: actualNewZ - z
            }
        }
    }
}
