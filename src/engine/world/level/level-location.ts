namespace splitTime {
    export class Coordinates2D {
        constructor(
            public x: number = 0,
            public y: number = 0
        ) {}
    }

    export class Coordinates3D {
        constructor(
            public x: number = 0,
            public y: number = 0,
            public z: number = 0
        ) {}
    }

    /**
     * @deprecated prefer ILevelLocation2 instead
     */
    export interface ILevelLocation {
        getX(): number
        getY(): number
        getZ(): number
        getLevel(): splitTime.Level
    }

    export interface ILevelLocation2 {
        x: number
        y: number
        z: number
        level: splitTime.Level
    }
}
namespace splitTime.level {
    export function copyLocation(location: ILevelLocation2) {
        return {
            level: location.level,
            x: location.x,
            y: location.y,
            z: location.z
        }
    }

    export function areCoordinatesEquivalent(coords1: Readonly<Coordinates2D>, coords2: Readonly<Coordinates2D>): boolean
    export function areCoordinatesEquivalent(coords1: Readonly<Coordinates3D>, coords2: Readonly<Coordinates3D>): boolean
    export function areCoordinatesEquivalent(coords1: Readonly<Coordinates3D> | Readonly<Coordinates2D>, coords2: Readonly<Coordinates3D> | Readonly<Coordinates2D>): boolean {
        return coords1.x === coords2.x &&
            coords1.y === coords2.y &&
            // TODO: This check falls apart for mixed types
            (coords1 as Readonly<Coordinates3D>).z === (coords2 as Readonly<Coordinates3D>).z
    }

    export function areLocationsEquivalent(location1: ILevelLocation2, location2: ILevelLocation2) {
        return location1.level === location2.level &&
            location1.x === location2.x &&
            location1.y === location2.y &&
            location1.z === location2.z
    }

    /**
     * @deprecated
     */
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

namespace splitTime.instanceOf {
    export function Coordinates2D(thing: unknown): thing is Coordinates2D {
        const coords = thing as Readonly<Coordinates2D>
        return !!thing && typeof coords.x === "number" && typeof coords.y === "number"
    }

    export function ILevelLocation(thing: unknown): thing is ILevelLocation {
        const location = thing as ILevelLocation
        return !!thing &&
            typeof location.getX === "function" &&
            typeof location.getY === "function" &&
            typeof location.getZ === "function" &&
            typeof location.getLevel === "function"
    }

    export function ILevelLocation2(thing: unknown): thing is ILevelLocation2 {
        const location = thing as ILevelLocation2
        return !!thing &&
            typeof location.x === "number" &&
            typeof location.y === "number" &&
            typeof location.z === "number" &&
            location.level instanceof Level
    }
}
