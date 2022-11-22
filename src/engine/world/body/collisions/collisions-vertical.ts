import { PointerOffset, isPointerOffsetSignificant } from "../../level/trace/trace";
import { BodySpec } from "../../../file/collage";
import { Mover } from "./body-mover";
import { addArrayToSet } from "./helpers";
import { SELF_LEVEL_ID } from "../../level/level-traces2";
import { copyLocation, areLocationsEquivalent, ILevelLocation2 } from "../../level/level-location";
import { Body } from "../body"
import { getAllStackedBodies } from "./stacked-bodies";
import { unitOrZero } from "engine/math/measurement";
import { Level } from "engine/world/level/level";
import { COLLISION_CALCULATOR, chooseTheOneOrDefault } from "./collision-calculator";

interface VerticalCollisionInfo {
    bodies: Body[]
    events: string[]
    targetOffset: PointerOffset | null
    dzAllowed: number
}

interface CachedFallStopBody {
    body: Body
    location: ILevelLocation2
    dimensions: BodySpec
}

interface CachedFallStop {
    location: ILevelLocation2
    dimensions: BodySpec
    bodies: CachedFallStopBody[]
    events: string[]
    targetOffset: PointerOffset | null
    ignoreBodies: readonly Body[]
}

export class Vertical {
    private lastFallStopped: CachedFallStop | null = null
    constructor(private readonly mover: Mover) {}

    /**
     * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
     * @param {number} maxDZ
     * @returns {number} Z pixels actually moved
     */
    zeldaVerticalMove(maxDZ: number): number {
        const level = this.mover.body.level

        // Optimization for falling but not falling case.
        if (maxDZ < 0) {
            const collisionInfo = this.mover.vertical.calculateZCollision(
                level,
                this.mover.body.x,
                this.mover.body.y,
                this.mover.body.z,
                maxDZ,
            )
            if (collisionInfo.dzAllowed === 0) {
                return 0
            }
        }

        const bodies = [this.mover.body, ...getAllStackedBodies(this.mover.body)]
        // Sort from low z to high z.
        bodies.sort((a, b) => (a.z - b.z))

        const calculations = bodies.map(b => b.mover.vertical.calculateZCollision(
            level,
            b.x,
            b.y,
            b.z,
            maxDZ,
            bodies,
        ))
        const dzAllowed = calculations.reduce(
            (allowed, c) => Math.abs(c.dzAllowed) < Math.abs(allowed) ? c.dzAllowed : allowed,
            maxDZ
        )

        const calculations2 = dzAllowed === maxDZ ? calculations : bodies.map(b => b.mover.vertical.calculateZCollision(
            level,
            b.x,
            b.y,
            b.z,
            dzAllowed,
            bodies,
        ))

        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i]
            const c = calculations2[i]
            b.setZ(b.z + c.dzAllowed)
            b.level.runEvents(c.events, b)
            if (isPointerOffsetSignificant(c.targetOffset, b.level)) {
                b.mover.transportLevelIfApplicable()
            }
        }

        return Math.abs(dzAllowed)
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
        ignoreBodies: readonly Body[] = []
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
        const targetOffsets: { [offsetHash: string]: PointerOffset | null } = {}
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

            const events = COLLISION_CALCULATOR.getEventsInVolume(
                level,
                left, this.mover.body.width,
                top, this.mover.body.depth,
                lowerBoundZ, 1
            )
            addArrayToSet(events, eventIdSet)

            const targetOffset = originCollisionInfo.targetOffset
            if (targetOffset === null) {
                targetOffsets[SELF_LEVEL_ID] = null
            } else {
                targetOffsets[targetOffset.getOffsetHash()] = targetOffset
            }
        }

        let dzAllowed = targetZ - z
        // If the amount we want to move is more than
        // the amount requested, go with requested
        if (Math.abs(dzAllowed) > Math.abs(dz)) {
            dzAllowed = dz
        }

        const r = {
            bodies: bodies,
            events: Object.keys(eventIdSet),
            targetOffset: chooseTheOneOrDefault(targetOffsets, null),
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
                    location: copyLocation(b),
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
        ignoreBodies: readonly Body[] = []
    ): boolean {
        if (dz >= 0) {
            return false
        }
        if (this.lastFallStopped === null) {
            return false
        }
        if (!areLocationsEquivalent({x, y, z, level}, this.lastFallStopped.location)) {
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
            if (!areLocationsEquivalent(body.body, body.location)) {
                return false
            }
        }
        return true
    }
}
