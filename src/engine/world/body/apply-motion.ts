import { Body } from "./body"
import { STOP_CALLBACKS } from "../../utils/register-callbacks"
import { Indirect, redirect } from "../../redirect"
import { Coordinates3D } from "../level/level-location"
import { direction_t, fromToThing } from "engine/math/direction"
import { pixels_t, distanceTrue } from "engine/math/measurement"
import { game_seconds } from "engine/time/timeline"

export function applyMotion(body: Body, dir: direction_t, speed: number, acceleration: number) {
    body.registerTimeAdvanceListener(delta => {
        if (!body.level.isLoaded() || speed <= 0) {
            return STOP_CALLBACKS
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

        const targetDir = fromToThing(body, currentTarget)
        const horizToGo = distanceTrue(currentTarget.x, currentTarget.y, body.x, body.y)
        const maxHoriz = horizToGo > maxD ? maxD : horizToGo < -maxD ? -maxD : horizToGo

        if (Math.abs(zToGo) < closeEnough && Math.abs(horizToGo) < closeEnough) {
            return STOP_CALLBACKS
        }

        body.zVelocity = 0
        body.mover.zeldaVerticalBump(maxDZ)
        body.mover.zeldaBump(maxHoriz, targetDir)

        timePassed += delta
        if (timePassed > tooLong) {
            return STOP_CALLBACKS
        }
    })
}