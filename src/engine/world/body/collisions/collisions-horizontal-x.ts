// NOTE: This file has a sister that is nearly identical: collisionsHorizontalY.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

namespace splitTime.body.collisions {
    /**
     * Check that dx can be accomplished, potentially with vertical adjustment (for slopes).
     */
    export function projectXPixelStepWithVerticalFudge(
        level: Level,
        dx: unit,
        primary: BodyMoveProjection,
        projections: readonly BodyMoveProjection[],
    ): PixelStepReturn {
        const ignoreBodies = projections.map(p => p.body)
        let dz = 0
        // Figure out if we're going to need to apply vertical fudge.
        const simpleCollisionInfo = calculateXPixelCollision(primary.body, level, primary.x.current, primary.y.current, primary.z.current, dx, ignoreBodies)
        let bodiesBlockingPrimary: readonly Body[] = simpleCollisionInfo.bodies
        if (simpleCollisionInfo.blocked) {
            if (simpleCollisionInfo.vStepUpEstimate <= splitTime.body.Mover.VERTICAL_FUDGE) {
                dz = simpleCollisionInfo.vStepUpEstimate
                if (!checkAllCanStepUp(projections, dz)) {
                    for (const p of projections) p.x.stopped = true
                    return { dz, bodiesBlockingPrimary }
                }
                for (const p of projections) {
                    p.z.current += dz
                }
            } else {
                for (const p of projections) p.x.stopped = true
                return { dz, bodiesBlockingPrimary }
            }
        }

        const collisionInfos: (SimplePixelCollisionReturn)[] = projections.map(p => {
            if (p.x.stopped) {
                return simpleBlocked
            }
            const alreadyCalculated = dz === 0 && p === primary
            const c = alreadyCalculated ?
                simpleCollisionInfo :
                calculateXPixelCollision(p.body, level, p.x.current, p.y.current, p.z.current, dx, ignoreBodies)
            if (c.blocked) {
                p.x.stopped = true
            } else {
                p.x.current = p.x.current + dx
            }
            return c
        })

        let needToCheckAgain = projections.length > 0
        while (needToCheckAgain) {
            needToCheckAgain = false
            for (let i = 0; i < projections.length; i++) {
                const p = projections[i]
                if (p.x.stopped) {
                    continue
                }
                for (const other of projections) {
                    if (other !== p && doProjectionsOverlap(other, p)) {
                        p.x.stopped = true
                        p.x.current = p.x.current - dx
                        collisionInfos[i] = simpleBlocked
                        needToCheckAgain = true
                    }
                }
                // Non-primary bodies should only move if a parent moved.
                if (p !== primary) {
                    let someParentMoved = false
                    for (const parent of p.parents) {
                        if (!parent.x.stopped) {
                            someParentMoved = true
                            break
                        }
                    }
                    if (!someParentMoved) {
                        p.x.stopped = true
                        p.x.current = p.x.current - dx
                        collisionInfos[i] = simpleBlocked
                        needToCheckAgain = true
                    }
                }
            }
        }

        for (let i = 0; i < projections.length; i++) {
            const p = projections[i]
            const c = collisionInfos[i]
            if (c === null) {
                // Do nothing.
            } else if (c.blocked) {
                p.x.stopped = true
            } else {
                p.x.pixelsMoved++
                addArrayToSet(c.events, p.eventIdSet)
                if (trace.isPointerOffsetSignificant(c.targetOffset, level)) {
                    p.mightMoveLevels = true
                }
            }

            if (p === primary) {
                bodiesBlockingPrimary = c?.bodies ?? []
            }
        }

        return { dz, bodiesBlockingPrimary }
        }

    /**
     * Check that dx can be accomplished.
     */
    function calculateXPixelCollision(
        body: Body,
        level: Level,
        x: number,
        y: number,
        z: number,
        dx: unit,
        ignoreBodies: readonly Body[]
    ): SimplePixelCollisionReturn {
        const edgeX =
            dx > 0
                ? x + dx + body.width / 2
                : x + dx - body.width / 2
        const top = y - body.depth / 2
        const solidCollisionInfo = splitTime.COLLISION_CALCULATOR.calculateVolumeCollision(
            body.collisionMask,
            level,
            edgeX, Math.abs(dx),
            top, body.depth,
            z, body.height,
            ignoreBodies
        )
        const events = COLLISION_CALCULATOR.getEventsInVolume(
            level,
            edgeX, Math.abs(dx),
            top, body.depth,
            z, body.height
        )
        return {
            ...solidCollisionInfo,
            events: events
        }
    }
}
