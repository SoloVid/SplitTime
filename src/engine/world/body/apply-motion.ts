namespace splitTime.body {
    export function applyMotion(body: Body, dir: direction_t, speed: number, acceleration: number) {
        body.registerTimeAdvanceListener(delta => {
            if (!body.level.isLoaded() || speed <= 0) {
                return splitTime.STOP_CALLBACKS
            }
            body.mover.zeldaBump(delta * speed, dir)
            speed += delta * acceleration
        })
    }

    const closeEnough = 0.1

    export function pushToOverTime(body: Body, target: Indirect<Readonly<Coordinates3D>>, speed: pixels_t, tooLong: game_seconds) {
        let timePassed = 0
        body.registerTimeAdvanceListener(delta => {
            const maxD = delta * speed

            const currentTarget = redirect(target)

            const targetZ = currentTarget.z
            const zToGo = targetZ - body.getZ()
            const maxDZ = zToGo > maxD ? maxD : zToGo < -maxD ? -maxD : zToGo

            const targetDir = splitTime.direction.fromToThing(body, currentTarget)
            const horizToGo = splitTime.measurement.distanceTrue(currentTarget.x, currentTarget.y, body.x, body.y)
            const maxHoriz = horizToGo > maxD ? maxD : horizToGo < -maxD ? -maxD : horizToGo

            if (Math.abs(zToGo) < closeEnough && Math.abs(horizToGo) < closeEnough) {
                return splitTime.STOP_CALLBACKS
            }

            body.zVelocity = 0
            body.mover.zeldaVerticalBump(maxDZ)
            body.mover.zeldaBump(maxHoriz, targetDir)

            timePassed += delta
            if (timePassed > tooLong) {
                return splitTime.STOP_CALLBACKS
            }
        })
    }
}