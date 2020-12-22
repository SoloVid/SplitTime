namespace splitTime.body.collisions {
    interface VerticalCollisionInfo {
        bodies: Body[]
        events: string[]
        targetOffset: trace.PointerOffset
        dzAllowed: number
    }

    interface CachedFallStopBody {
        body: Body
        location: ILevelLocation2
        dimensions: file.collage.BodySpec
    }

    interface CachedFallStop {
        location: ILevelLocation2
        dimensions: file.collage.BodySpec
        bodies: CachedFallStopBody[]
        events: string[]
        targetOffset: trace.PointerOffset
        ignoreBodies: Body[]
    }

    export class Vertical {
        private lastFallStopped: CachedFallStop | null = null
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
                if (trace.isPointerOffsetSignificant(collisionInfo.targetOffset, this.mover.body.level)) {
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
            if (this.canApplyCachedFall(level, x, y, z, dz, ignoreBodies)) {
                return {
                    bodies: this.lastFallStopped!.bodies.map(a => a.body),
                    events: this.lastFallStopped!.events,
                    targetOffset: this.lastFallStopped!.targetOffset,
                    dzAllowed: 0
                }
            }

            this.lastFallStopped = null

            //If the body is out of bounds on the Z axis
            if (z + dz < level.lowestLayerZ) {
                dz = -(z - level.lowestLayerZ)
            }

            const dzRoundedUp = dz > 0 ? Math.ceil(dz) : Math.floor(dz)
            const adz = Math.abs(dzRoundedUp)
            let steps = adz

            //-1 for negative movement on the axis, 1 for positive
            var kHat = (dz === 0 ? 0 : dzRoundedUp / adz) as unitOrZero

            const left = x - this.mover.body.width / 2
            const top = y - this.mover.body.depth / 2
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
            const targetOffsets: { [offsetHash: string]: trace.PointerOffset } = {}
            var eventIdSet = {}
            let blocked = false
            for (var i = 0; i < steps; i++) {
                const originCollisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(
                    this.mover.body.collisionMask,
                    level,
                    left, this.mover.body.width,
                    top, this.mover.body.depth,
                    lowerBoundZ, 1,
                    ignoreBodies.concat(this.mover.body)
                )
                // Ground traces don't cause the blocked flag to be set,
                // but we can detect the blockage through zBlockedTopEx
                if (originCollisionInfo.blocked || originCollisionInfo.zBlockedTopEx === lowerBoundZ) {
                    blocked = true
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
                targetOffsets[originCollisionInfo.targetOffset.getOffsetHash()] = originCollisionInfo.targetOffset
            }

            let dzAllowed = targetZ - z
            // If the amount we want to move is more than
            // the amount requested, go with requested
            if (Math.abs(dzAllowed) > adz) {
                dzAllowed = dz
            }

            const r = {
                bodies: bodies,
                events: Object.keys(eventIdSet),
                targetOffset: choosePointerOffset(targetOffsets, level),
                dzAllowed: dzAllowed
            }
            if (dz < 0 && blocked) {
                this.lastFallStopped = {
                    location: { x, y, z: targetZ, level },
                    dimensions: {
                        width: this.mover.body.width,
                        depth: this.mover.body.depth,
                        height: this.mover.body.height,
                    },
                    bodies: r.bodies.map(b => ({
                        body: b,
                        location: splitTime.level.copyLocation(b),
                        dimensions: {
                            width: b.width,
                            depth: b.depth,
                            height: b.height
                        }
                    })),
                    events: r.events,
                    targetOffset: r.targetOffset,
                    ignoreBodies: ignoreBodies
                }
            }
            return r
        }

        private canApplyCachedFall(
            level: Level,
            x: number,
            y: number,
            z: number,
            dz: number,
            ignoreBodies: Body[] = []
        ): boolean {
            if (dz >= 0) {
                return false
            }
            if (this.lastFallStopped === null) {
                return false
            }
            if (!splitTime.level.areLocationsEquivalent({x, y, z, level}, this.lastFallStopped.location)) {
                return false
            }
            if (this.lastFallStopped.dimensions.width !== this.mover.body.width ||
                this.lastFallStopped.dimensions.depth !== this.mover.body.depth ||
                this.lastFallStopped.dimensions.height !== this.mover.body.height) {
                return false
            }
            if (ignoreBodies.length !== this.lastFallStopped.ignoreBodies.length) {
                return false
            }
            for (let i = 0; i < ignoreBodies.length; i++) {
                if (ignoreBodies[i] !== this.lastFallStopped.ignoreBodies[i]) {
                    return false
                }
            }
            for (const body of this.lastFallStopped.bodies) {
                if (!body.body.hasLevel()) {
                    return false
                }
                if (body.dimensions.width !== body.body.width ||
                    body.dimensions.depth !== body.body.depth ||
                    body.dimensions.height !== body.body.height) {
                    return false
                }
                if (!splitTime.level.areLocationsEquivalent(body.body, body.location)) {
                    return false
                }
            }
            return true
        }
    }
}
