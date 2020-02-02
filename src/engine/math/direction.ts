namespace SplitTime {
    export type direction_t = number
}

namespace SplitTime.direction {
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
        if (stringDir in SplitTime.direction) {
            return (SplitTime.direction as any)[stringDir]
        } else {
            Logger.warn("Invalid direction: " + stringDir)
            return -1
        }
    }
    export function toString(numDir: direction_t): string {
        var modDir = SLVD.mod(Math.round(numDir), 4)
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
        fromThing: { x: number; y: number },
        toThing: { x: number; y: number }
    ): direction_t
    export function fromToThing(fromThing: any, toThing: any): direction_t {
        if (typeof fromThing.getX === "function") {
            return SplitTime.direction.fromTo(
                fromThing.getX(),
                fromThing.getY(),
                toThing.getX(),
                toThing.getY()
            )
        }
        return SplitTime.direction.fromTo(
            fromThing.x,
            fromThing.y,
            toThing.x,
            toThing.y
        )
    }

    export function simplifyToCardinal(realDir: string | number | null) {
        if (realDir === null) {
            return null
        }

        if (typeof realDir === "string") {
            return realDir.charAt(0)
        }

        return SLVD.mod(Math.round(realDir), 4)
    }

    export function getRandom(): direction_t {
        return (SLVD.randomInt(16) - 1) / 4
    }
    export function getRandomCardinal(): direction_t {
        return SLVD.randomInt(4) - 1
    }
    export function getRandomOctal(): direction_t {
        return (SLVD.randomInt(8) - 1) / 2
    }

    export function getXMagnitude(direction: string | direction_t): number {
        if (typeof direction === "string") {
            return SplitTime.direction.getXMagnitude(
                SplitTime.direction.fromString(direction)
            )
        }

        return Math.cos(direction * (Math.PI / 2))
    }
    export function getXSign(direction: string | direction_t) {
        var magnitude = SplitTime.direction.getXMagnitude(direction)
        if (magnitude > 0.1) {
            return 1
        } else if (magnitude < -0.1) {
            return -1
        }
        return 0
    }

    export function getYMagnitude(direction: string | direction_t): number {
        if (typeof direction === "string") {
            return SplitTime.direction.getYMagnitude(
                SplitTime.direction.fromString(direction)
            )
        }

        return -Math.sin(direction * (Math.PI / 2))
    }
    export function getYSign(direction: string | direction_t): unitOrZero {
        var magnitude = SplitTime.direction.getYMagnitude(direction)
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
}
