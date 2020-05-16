namespace splitTime {

    export interface ReadonlyCoordinates2D {
        readonly x: number
        readonly y: number
    }

    export namespace instanceOf {
        export function ReadonlyCoordinates2D(thing: unknown): thing is ReadonlyCoordinates2D {
            const coords = thing as ReadonlyCoordinates2D
            return typeof coords.x === "number" && typeof coords.y === "number"
        }
    }

    export class Coordinates2D implements ReadonlyCoordinates2D {
        constructor(
            public x: number = 0,
            public y: number = 0
        ) {}
    }

    export interface ReadonlyCoordinates3D {
        readonly x: number
        readonly y: number
        readonly z: number
    }

    export class Coordinates3D {
        constructor(
            public x: number = 0,
            public y: number = 0,
            public z: number = 0
        ) {}
    }

    export interface ILevelLocation {
        getX(): number
        getY(): number
        getZ(): number
        getLevel(): splitTime.Level
    }

    export namespace instanceOf {
        export function ILevelLocation(thing: unknown): thing is ILevelLocation {
            const location = thing as ILevelLocation
            return typeof location.getX === "function" &&
                typeof location.getY === "function" &&
                typeof location.getZ === "function" &&
                typeof location.getLevel === "function"
        }
    }

    export interface ILevelLocation2 {
        x: number
        y: number
        z: number
        level: splitTime.Level
    }

    export namespace level {
        export function copyLocation(location: ILevelLocation2) {
            return {
                level: location.level,
                x: location.x,
                y: location.y,
                z: location.z
            }
        }

        export function areLocationsEquivalent(location1: ILevelLocation2, location2: ILevelLocation2) {
            return location1.level === location2.level &&
                location1.x === location2.x &&
                location1.y === location2.y &&
                location1.z === location2.z
        }

        export class Location implements ILevelLocation {
            constructor(
                public readonly x: number,
                public readonly y: number,
                public readonly z: number,
                public readonly level: Level
            ) {}
            getX(): number {
                return this.x
            }
            getY(): number {
                return this.y
            }
            getZ(): number {
                return this.z
            }
            getLevel(): Level {
                return this.level
            }
        }
    }
}
