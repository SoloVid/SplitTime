import { BodyMoveProjection } from "./body-move-projection"
import { Mover } from "./body-mover"

export function calculateGroupStepUp(projections: readonly BodyMoveProjection[], max: number) {
    return projections.reduce((maxStepUpSoFar, p) => {
        const stepUpCollisionInfo = p.body.mover.vertical.calculateZCollision(
            // TODO: I had dx/dy in here before. Should it be here?
            p.body.level, p.x.current, p.y.current, p.z.current,
            Mover.VERTICAL_FUDGE,
            projections.map(p => p.body)
        )
        return Math.min(maxStepUpSoFar, stepUpCollisionInfo.dzAllowed)
    }, max)
}

export function checkAllCanStepUp(projections: readonly BodyMoveProjection[], dz: number) {
    for (const p of projections) {
        const stepUpCollisionInfo = p.body.mover.vertical.calculateZCollision(
            // TODO: I had dx/dy in here before. Should it be here?
            p.body.level, p.x.current, p.y.current, p.z.current,
            Mover.VERTICAL_FUDGE,
            projections.map(p => p.body)
        )
        if (stepUpCollisionInfo.dzAllowed < dz) {
            return false
        }
    }
    return true
}
