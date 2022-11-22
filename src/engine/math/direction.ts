import { approachValue, mod } from "engine/utils/misc";
import { randomInt, randomRanged } from "engine/utils/random";
import { Coordinates2D, ILevelLocation, instanceOfCoordinates2D, instanceOfILevelLocation } from "engine/world/level/level-location";
import { unitOrZero } from "./measurement";

export type direction_t = number;
export const E = 0;
export const N = 1;
export const W = 2;
export const S = 3;
export const NE = 0.5;
export const EN = NE;
export const NW = 1.5;
export const WN = NW;
export const SW = 2.5;
export const WS = SW;
export const SE = 3.5;
export const ES = SE;
const lookup: {
    [dir: string]: direction_t;
} = {
    "E": E,
    "N": N,
    "W": W,
    "S": S,
    "NE": NE,
    "EN": EN,
    "NW": NW,
    "WN": WN,
    "SW": SW,
    "WS": WS,
    "SE": SE,
    "ES": ES
};
export function interpret(inputDir: string | number): direction_t {
    if (typeof inputDir === "string") {
        if (isNaN(+inputDir)) {
            return fromString(inputDir);
        }
        else {
            return +inputDir;
        }
    }
    return inputDir;
}
export function fromString(stringDir: string): direction_t {
    if (typeof lookup[stringDir] !== "undefined") {
        return lookup[stringDir];
    }
    else {
        throw new Error("Invalid direction: " + stringDir);
    }
}
export function toString(numDir: direction_t): string {
    var modDir = normalize(Math.round(numDir * 10) / 10);
    switch (modDir) {
        case 0:
            return "E";
        case 1:
            return "N";
        case 2:
            return "W";
        case 3:
            return "S";
        default:
            if (modDir < 1)
                return "NE";
            else if (modDir < 2)
                return "NW";
            else if (modDir < 3)
                return "SW";
            else
                return "SE";
    }
}
//Get direction from one point to another (both in Maven orientation)
export function fromTo(fromX: number, fromY: number, toX: number, toY: number): direction_t {
    if (fromX == toX) {
        if (fromY < toY)
            return 3;
        else
            return 1;
    }
    var baseDir = -Math.atan((fromY - toY) / (fromX - toX)) / (Math.PI / 2);
    //not in atan range
    if (fromX > toX) {
        baseDir += 2;
    }
    return (baseDir + 4) % 4;
}
//Get direction from one thing to another (both in Maven orientation)
export function fromToThing(fromThing: ILevelLocation, toThing: ILevelLocation): direction_t;
export function fromToThing(fromThing: Readonly<Coordinates2D>, toThing: Readonly<Coordinates2D>): direction_t;
export function fromToThing(fromThing: Readonly<Coordinates2D> | ILevelLocation, toThing: Readonly<Coordinates2D> | ILevelLocation): direction_t {
    if (instanceOfILevelLocation(fromThing) && instanceOfILevelLocation(toThing)) {
        return fromTo(fromThing.getX(), fromThing.getY(), toThing.getX(), toThing.getY());
    }
    if (instanceOfCoordinates2D(fromThing) && instanceOfCoordinates2D(toThing)) {
        return fromTo(fromThing.x, fromThing.y, toThing.x, toThing.y);
    }
    throw new Error("Types of from and to should be matched");
}
export function getOpposite(dir: direction_t): direction_t {
    return normalize(dir + 2);
}
export function getRotated(dir: direction_t, howMany90Degrees: number = 1): direction_t {
    return normalize(dir + howMany90Degrees);
}
export function simplifyToCardinal(realDir: direction_t): direction_t {
    return normalize(Math.round(realDir));
}
export function getRandom(): direction_t {
    return randomRanged(0, 4);
}
export function getRandomCardinal(): direction_t {
    return randomInt(4) - 1;
}
export function getRandomOctal(): direction_t {
    return (randomInt(8) - 1) / 2;
}
export function getXMagnitude(direction: string | direction_t): number {
    if (typeof direction === "string") {
        return getXMagnitude(fromString(direction));
    }
    return Math.cos(direction * (Math.PI / 2));
}
export function getXSign(direction: string | direction_t) {
    var magnitude = getXMagnitude(direction);
    if (magnitude > 0.1) {
        return 1;
    }
    else if (magnitude < -0.1) {
        return -1;
    }
    return 0;
}
export function getYMagnitude(direction: string | direction_t): number {
    if (typeof direction === "string") {
        return getYMagnitude(fromString(direction));
    }
    return -Math.sin(direction * (Math.PI / 2));
}
export function getYSign(direction: string | direction_t): unitOrZero {
    var magnitude = getYMagnitude(direction);
    if (magnitude > 0.1) {
        return 1;
    }
    else if (magnitude < -0.1) {
        return -1;
    }
    return 0;
}
export function areWithin90Degrees(dir1: direction_t, dir2: direction_t, howMany90Degrees: number = 1): boolean {
    return difference(dir1, dir2) < howMany90Degrees;
}
/**
 * Convert from SplitTime representation of direction to radians for math
 * @param direction SplitTime direction
 * @param invert (default true) change from y-axis down to up
 */
export function toRadians(direction: direction_t, invert: boolean = true): number {
    let radians = direction * (Math.PI / 2);
    if (invert) {
        radians = -radians;
    }
    return radians;
}
/**
 * Convert from radians to SplitTime representation of direction
 * @param radians direction in radians
 * @param invert (default true) change from y-axis down to up
 */
export function fromRadians(radians: number, invert: boolean = true): direction_t {
    if (invert) {
        radians = -radians;
    }
    let direction = mod(radians / (Math.PI / 2), 4);
    return direction;
}
export function approach(oldDir: direction_t, targetDir: direction_t, step: number): direction_t {
    oldDir = normalize(oldDir);
    targetDir = normalize(targetDir);
    if (oldDir > 3 && targetDir < 1) {
        targetDir += 4;
    }
    if (oldDir < 1 && targetDir > 3) {
        targetDir -= 4;
    }
    return normalize(approachValue(oldDir, targetDir, step));
}
export function difference(dir1: direction_t, dir2: direction_t): direction_t {
    return Math.min(normalize(dir1 - dir2), normalize(dir2 - dir1));
}
export function normalize(dir: direction_t): direction_t {
    return mod(dir, 4);
}
