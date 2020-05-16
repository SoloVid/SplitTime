namespace splitTime {
    export type direction_t = number
}

namespace splitTime.direction {
    export const E = 0
    export const N = 1
    export const W = 2
    export const S = 3
    export const NE = 0.5
    export const EN = NE
    export const NW = 1.5
    export const WN = NW
    export const SW = 2.5
    export const WS = SW
    export const SE = 3.5
    export const ES = SE

    const lookup: { [dir: string]: direction_t } = {
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
    }

    export function interpret(inputDir: string | number): direction_t {
        if (typeof inputDir === "string") {
            if (isNaN(+inputDir)) {
                return fromString(inputDir)
            } else {
                return +inputDir
            }
        }
        return inputDir
    }

    export function fromString(stringDir: string): direction_t {
        if (typeof lookup[stringDir] !== "undefined") {
            return lookup[stringDir]
        } else {
            log.warn("Invalid direction: " + stringDir)
            return -1
        }
    }
    export function toString(numDir: direction_t): string {
        var modDir = splitTime.mod(Math.round(numDir), 4)
        switch (modDir) {
            case 0:
                return "E"
            case 1:
                return "N"
            case 2:
                return "W"
            case 3:
                return "S"
            default:
                if (modDir < 1) return "NE"
                else if (modDir < 2) return "NW"
                else if (modDir < 3) return "SW"
                else return "SE"
        }
    }

    //Get direction from one point to another (both in Maven orientation)
    export function fromTo(
        fromX: number,
        fromY: number,
        toX: number,
        toY: number
    ): direction_t {
        if (fromX == toX) {
            if (fromY < toY) return 3
            else return 1
        }

        var baseDir = -Math.atan((fromY - toY) / (fromX - toX)) / (Math.PI / 2)

        //not in atan range
        if (fromX > toX) {
            baseDir += 2
        }

        return (baseDir + 4) % 4
    }

    //Get direction from one thing to another (both in Maven orientation)
    export function fromToThing(
        fromThing: ILevelLocation,
        toThing: ILevelLocation
    ): direction_t
    export function fromToThing(
        fromThing: ReadonlyCoordinates2D,
        toThing: ReadonlyCoordinates2D
    ): direction_t
    export function fromToThing(
        fromThing: ReadonlyCoordinates2D | ILevelLocation,
        toThing: ReadonlyCoordinates2D | ILevelLocation
    ): direction_t {
        if (instanceOf.ILevelLocation(fromThing) && instanceOf.ILevelLocation(toThing)) {
            return splitTime.direction.fromTo(
                fromThing.getX(),
                fromThing.getY(),
                toThing.getX(),
                toThing.getY()
            )
        }
        if (instanceOf.ReadonlyCoordinates2D(fromThing) && instanceOf.ReadonlyCoordinates2D(toThing)) {
            return splitTime.direction.fromTo(
                fromThing.x,
                fromThing.y,
                toThing.x,
                toThing.y
            )
        }
        throw new Error("Types of from and to should be matched")
    }

    export function simplifyToCardinal(realDir: string | number | null) {
        if (realDir === null) {
            return null
        }

        if (typeof realDir === "string") {
            return realDir.charAt(0)
        }

        return splitTime.mod(Math.round(realDir), 4)
    }

    export function getRandom(): direction_t {
        return (splitTime.randomInt(16) - 1) / 4
    }
    export function getRandomCardinal(): direction_t {
        return splitTime.randomInt(4) - 1
    }
    export function getRandomOctal(): direction_t {
        return (splitTime.randomInt(8) - 1) / 2
    }

    export function getXMagnitude(direction: string | direction_t): number {
        if (typeof direction === "string") {
            return splitTime.direction.getXMagnitude(
                splitTime.direction.fromString(direction)
            )
        }

        return Math.cos(direction * (Math.PI / 2))
    }
    export function getXSign(direction: string | direction_t) {
        var magnitude = splitTime.direction.getXMagnitude(direction)
        if (magnitude > 0.1) {
            return 1
        } else if (magnitude < -0.1) {
            return -1
        }
        return 0
    }

    export function getYMagnitude(direction: string | direction_t): number {
        if (typeof direction === "string") {
            return splitTime.direction.getYMagnitude(
                splitTime.direction.fromString(direction)
            )
        }

        return -Math.sin(direction * (Math.PI / 2))
    }
    export function getYSign(direction: string | direction_t): unitOrZero {
        var magnitude = splitTime.direction.getYMagnitude(direction)
        if (magnitude > 0.1) {
            return 1
        } else if (magnitude < -0.1) {
            return -1
        }
        return 0
    }

    export function areWithin90Degrees(
        dir1: direction_t,
        dir2: direction_t,
        howMany90Degrees: int = 1
    ): boolean {
        howMany90Degrees = howMany90Degrees
        var dDir = Math.abs(dir1 - dir2)
        return dDir < howMany90Degrees || dDir > 4 - howMany90Degrees
    }

    /**
     * Convert from SplitTime representation of direction to radians for math
     * @param direction SplitTime direction
     * @param invert (default true) change from y-axis down to up
     */
    export function toRadians(direction: direction_t, invert: boolean = true): number {
        let radians = direction * (Math.PI / 2)
        if (invert) {
            radians = -radians
        }
        return radians
    }
}
