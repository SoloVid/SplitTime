namespace splitTime.body {
    const ARBITRARY_MAX_DETECTION_RADIUS = 256
    const ARBITRARY_DETECTION_RADIUS = 48

    export function canDetect(detective: Body, target: Body): boolean {
        if (detective.getLevel() !== target.getLevel()) {
            return false
        }

        var proximity = splitTime.measurement.distanceEasy(
            detective.x,
            detective.y,
            target.x,
            target.y
        )
        if (
            proximity < ARBITRARY_MAX_DETECTION_RADIUS &&
            isZOverlap(detective, target)
        ) {
            return (
                isJustNearEnough(detective, target) || canSee(detective, target)
            )
        }

        return false
    }

    function canSee(detective: Body, target: Body): boolean {
        if (
            !direction.areWithin90Degrees(
                detective.dir,
                direction.fromToThing(detective, target),
                1.5
            )
        ) {
            return false
        }

        const centerOfTarget = new level.Location(
            target.x,
            target.y,
            target.z + target.height / 2,
            target.level
        )
        if (
            doesRayReach(detective.speechBox, centerOfTarget, detective, target)
        ) {
            return true
        }
        // TODO: add more rays
        return false
    }

    function isJustNearEnough(detective: Body, target: Body): boolean {
        var proximity = splitTime.measurement.distanceTrue(
            detective.x,
            detective.y,
            target.x,
            target.y
        )
        return proximity < ARBITRARY_DETECTION_RADIUS
    }

    function doesRayReach(
        start: ILevelLocation,
        end: ILevelLocation,
        detective: Body,
        target: Body
    ): boolean {
        let blocked = false
        // TODO: 3D bresenham
        SLVD.bresenham.forEachPoint(
            start.getX(),
            start.getY(),
            end.getX(),
            end.getY(),
            (x, y) => {
                const collisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(
                    start.getLevel(),
                    x,
                    1,
                    y,
                    1,
                    start.getZ(),
                    1,
                    detective
                )
                if (collisionInfo.blocked) {
                    if (collisionInfo.bodies.indexOf(target) >= 0) {
                        // We hit the target! Success.
                    } else {
                        blocked = true
                    }
                    return SLVD.bresenham.ReturnCode.EXIT_EARLY
                }
                return SLVD.bresenham.ReturnCode.CONTINUE
            }
        )
        return !blocked
    }

    // Copied from CellGrid
    function isZOverlap(body1: Body, body2: Body) {
        var noOverlap =
            body1.z + body1.height <= body2.z ||
            body2.z + body2.height <= body1.z
        return !noOverlap
    }
}
