import { PointerOffset, isPointerOffsetSignificant } from "../../level/trace/trace";
import { HorizontalX } from "./collisions-horizontal-x";
import { HorizontalY } from "./collisions-horizontal-y";
import { Sliding } from "./collisions-sliding";
import { Mover } from "./body-mover";
import { unitOrZero, unit } from "../../../splitTime";
import { E, W, S, N } from "../../../math/direction";
import { addArrayToSet } from "./helpers";
import { distanceTrue } from "../../../math/measurement";
import * as splitTime from "../../../splitTime";

const ZILCH = 0.000001 as const

export class HorizontalCollisionInfo {
    blocked: boolean = false
    bodies: Body[] = []
    adjustedZ: number
    events: string[] = []
    targetOffset: trace.PointerOffset | null = null

    constructor(z: number) {
        this.adjustedZ = z
    }
}

export class Horizontal {
    sliding: Sliding
    constructor(private readonly mover: splitTime.body.Mover) {
        this.sliding = new Sliding(mover)
    }
    /**
     * Advances splitTime.Body up to maxDistance pixels as far as is legal.
     * Includes pushing other Bodys out of the way
     * @returns distance actually moved
     */
    zeldaStep(dir: number, maxDistance: number, withPush: boolean): number {
        const level = this.mover.body.level

        const projections = buildStackProjectionList(this.mover.body)
        const primary = projections[0]

        let dy = -maxDistance * Math.sin(dir * (Math.PI / 2)) //Total y distance to travel
        if (Math.abs(dy) < ZILCH) {
            dy = 0
        }
        const dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy)
        const ady = Math.abs(dyRounded)

        primary.y.delta = dy
        primary.y.target = primary.y.current + dy

        let dx = maxDistance * Math.cos(dir * (Math.PI / 2)) //Total x distance to travel
        if (Math.abs(dx) < ZILCH) {
            dx = 0
        }
        const dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx)
        const adx = Math.abs(dxRounded)

        primary.x.delta = dx
        primary.x.target = primary.x.current + dx

        primary.deltasCalculated = true
        for (const p of projections) {
            fillInDeltas(p)
        }

        //-1 for negative movement on the axis, 1 for positive
        const jHat = Math.round(dy === 0 ? 0 : dyRounded / ady) as unitOrZero
        const iHat = Math.round(dx === 0 ? 0 : dxRounded / adx) as unitOrZero

        const maxIterations = adx + ady
        let xPixelsRemaining = adx
        let yPixelsRemaining = ady
        let somethingPushed = false

        for (var i = 0; i < maxIterations; i++) {
            if (xPixelsRemaining > 0 && iHat !== 0 && !primary.x.stopped) {
                // Always one less.
                xPixelsRemaining--
                const xStepResult = projectXPixelStepWithVerticalFudge(level, iHat, primary, projections)
                if (withPush && xStepResult.bodiesBlockingPrimary.length > 0) {
                    // Slow down when pushing.
                    xPixelsRemaining--
                    const pushed = this.tryPushOtherBodies(
                        xStepResult.bodiesBlockingPrimary,
                        dx > 0
                            ? splitTime.direction.E
                            : splitTime.direction.W
                    )
                    somethingPushed ||= pushed
                }
                // Slow down when ascending slope.
                xPixelsRemaining -= Math.ceil(Math.abs(xStepResult.dz))
            }

            if (yPixelsRemaining > 0 && jHat !== 0 && !primary.y.stopped) {
                // Always one less.
                yPixelsRemaining--
                const yStepResult = projectYPixelStepWithVerticalFudge(level, jHat, primary, projections)
                if (withPush && yStepResult.bodiesBlockingPrimary.length > 0) {
                    // Slow down when pushing.
                    yPixelsRemaining--
                    const pushed = this.tryPushOtherBodies(
                        yStepResult.bodiesBlockingPrimary,
                        dy > 0
                            ? splitTime.direction.S
                            : splitTime.direction.N
                    )
                    somethingPushed ||= pushed
                }
                // Slow down when ascending slope.
                yPixelsRemaining -= Math.ceil(Math.abs(yStepResult.dz))
            }
        }

        for (const p of projections) {
            p.body.setX(p.x.current)
            p.body.setY(p.y.current)
            p.body.setZ(p.z.current)

            p.body.level.runEvents(Object.keys(p.eventIdSet), p.body)
            if (p.mightMoveLevels) {
                p.body.mover.transportLevelIfApplicable()
            }
        }

        //If stopped, help person out by sliding around corner
        var stopped = primary.x.stopped || primary.y.stopped
        if (
            stopped &&
            !somethingPushed &&
            primary.x.pixelsMoved + primary.y.pixelsMoved < maxDistance / 2
        ) {
            this.sliding.zeldaSlide(maxDistance / 2)
        }

        return splitTime.measurement.distanceTrue(
            primary.x.old,
            primary.y.old,
            this.mover.body.getX(),
            this.mover.body.getY()
        )
    }

    /**
     * Try to push bodies.
     * @return true if something was pushed successfully.
     */
    tryPushOtherBodies(bodies: readonly Body[], dir: number): boolean {
        let somethingPushed = false
        this.mover.bodyExt.pushing = true
        try {
            // TODO: Push all of these at the same time instead of separately.
            for (const body of bodies) {
                // TODO: should this be different speeds depending on some parameters?
                if (body.pushable) {
                    const pushed = body.mover.zeldaBump(1, dir)
                    somethingPushed ||= pushed
                }
                return somethingPushed
            }
        } finally {
            this.mover.bodyExt.pushing = false
        }
        return somethingPushed
    }
}
