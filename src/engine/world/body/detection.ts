import { distanceEasy, distanceTrue } from "../../math/measurement";
import { areWithin90Degrees, fromToThing } from "../../math/direction";
import { forEachPoint, ReturnCode } from "../../math/bresenham";
import type { Body } from "./body"
import { ILevelLocation } from "../level/level-location";
import { COLLISION_CALCULATOR } from "./collisions/collision-calculator";
import { Location } from "../level/level-location";

const ARBITRARY_MAX_DETECTION_RADIUS = 256;
const ARBITRARY_DETECTION_RADIUS = 48;
export function canDetect(detective: Body, target: Body, sightDistance: number = ARBITRARY_MAX_DETECTION_RADIUS, senseDistance: number = ARBITRARY_DETECTION_RADIUS): boolean {
    if (detective.getLevel() !== target.getLevel()) {
        return false;
    }
    var proximity = distanceEasy(detective.x, detective.y, target.x, target.y);
    if (proximity < sightDistance &&
        isZOverlap(detective, target)) {
        return (isJustNearEnough(detective, target, senseDistance) || canSee(detective, target));
    }
    return false;
}
function canSee(detective: Body, target: Body): boolean {
    if (!areWithin90Degrees(detective.dir, fromToThing(detective, target), 1.5)) {
        return false;
    }
    const centerOfDetective = new Location(detective.x, detective.y, detective.z + detective.height / 2, detective.level);
    const centerOfTarget = new Location(target.x, target.y, target.z + target.height / 2, target.level);
    if (doesRayReach(centerOfDetective, centerOfTarget, detective, target)) {
        return true;
    }
    // TODO: add more rays
    return false;
}
function isJustNearEnough(detective: Body, target: Body, senseDistance: number): boolean {
    var proximity = distanceTrue(detective.x, detective.y, target.x, target.y);
    return proximity < senseDistance;
}
function doesRayReach(start: ILevelLocation, end: ILevelLocation, detective: Body, target: Body): boolean {
    let blocked = false;
    // TODO: 3D bresenham
    forEachPoint(start.getX(), start.getY(), end.getX(), end.getY(), (x, y) => {
        const collisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(detective.collisionMask, start.getLevel(), x, 1, y, 1, start.getZ(), 1, [detective]);
        if (collisionInfo.blocked) {
            if (collisionInfo.bodies.indexOf(target) >= 0) {
                // We hit the target! Success.
            }
            else {
                blocked = true;
            }
            return ReturnCode.EXIT_EARLY;
        }
        return ReturnCode.CONTINUE;
    });
    return !blocked;
}
// Copied from CellGrid
function isZOverlap(body1: Body, body2: Body) {
    var noOverlap = body1.z + body1.height <= body2.z ||
        body2.z + body2.height <= body1.z;
    return !noOverlap;
}
