// NOTE: This file has a sister that is nearly identical: collisionsHorizontalX.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

namespace splitTime.body.collisions {
    /**
     * Check that dy can be accomplished, potentially with vertical adjustment (for slopes).
     */
    export function projectYPixelStepWithVerticalFudge(
        level: Level,
        dy: unit,
        primary: BodyMoveProjection,
        projections: readonly BodyMoveProjection[],
    ): PixelStepReturn {
        const ignoreBodies = projections.map(p => p.body)
        let dz = 0
        // Figure out if we're going to need to apply vertical fudge.
        const simpleCollisionInfo = calculateYPixelCollision(primary.body, level, primary.x.current, primary.y.current, primary.z.current, dy, ignoreBodies)
        let bodiesBlockingPrimary: readonly Body[] = simpleCollisionInfo.bodies
        if (simpleCollisionInfo.blocked) {
            if (simpleCollisionInfo.vStepUpEstimate <= splitTime.body.Mover.VERTICAL_FUDGE) {
                dz = simpleCollisionInfo.vStepUpEstimate
                if (!checkAllCanStepUp(projections, dz)) {
                    for (const p of projections) p.y.stopped = true
                    return { dz, bodiesBlockingPrimary }
                }
                for (const p of projections) {
                    p.z.current += dz
                }
            } else {
                for (const p of projections) p.y.stopped = true
                return { dz, bodiesBlockingPrimary }
            }
        }

        const collisionInfos: (SimplePixelCollisionReturn)[] = projections.map(p => {
            if (p.y.stopped) {
                return simpleBlocked
            }
            const alreadyCalculated = dz === 0 && p === primary
            const c = alreadyCalculated ?
                simpleCollisionInfo :
                calculateYPixelCollision(p.body, level, p.x.current, p.y.current, p.z.current, dy, ignoreBodies)
            if (c.blocked) {
                p.y.stopped = true
            } else {
                p.y.current = p.y.current + dy
            }
            return c
        })

        let needToCheckAgain = projections.length > 0
        while (needToCheckAgain) {
            needToCheckAgain = false
            for (let i = 0; i < projections.length; i++) {
                const p = projections[i]
                if (p.y.stopped) {
                    continue
                }
                for (const other of projections) {
                    if (other !== p && doProjectionsOverlap(other, p)) {
                        p.y.stopped = true
                        p.y.current = p.y.current - dy
                        collisionInfos[i] = simpleBlocked
                        needToCheckAgain = true
                        break
                    }
                }
                // Non-primary bodies should only move if a parent moved.
                if (p !== primary) {
                    let someParentMoved = false
                    for (const parent of p.parents) {
                        if (!parent.y.stopped) {
                            someParentMoved = true
                            break
                        }
                    }
                    if (!someParentMoved) {
                        p.y.stopped = true
                        p.y.current = p.y.current - dy
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
                p.y.stopped = true
            } else {
                p.y.pixelsMoved++
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
     * Check that dy can be accomplished.
     */
    function calculateYPixelCollision(
        body: Body,
        level: Level,
        x: number,
        y: number,
        z: number,
        dy: unit,
        ignoreBodies: readonly Body[]
    ): SimplePixelCollisionReturn {
        const edgeY =
            dy > 0
                ? y + dy + body.depth / 2
                : y + dy - body.depth / 2
        const left = x - body.width / 2
        const solidCollisionInfo = splitTime.COLLISION_CALCULATOR.calculateVolumeCollision(
            body.collisionMask,
            level,
            left, body.width,
            edgeY, Math.abs(dy),
            z, body.height,
            ignoreBodies
        )
        const events = COLLISION_CALCULATOR.getEventsInVolume(
            level,
            left, body.width,
            edgeY, Math.abs(dy),
            z, body.height
        )
        return {
            ...solidCollisionInfo,
            events: events
        }
    }
}
