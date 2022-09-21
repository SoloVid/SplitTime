import { Level } from "../../splitTime";
import * as splitTime from "../../splitTime";
export class Coordinates2D {
    constructor(public x: number = 0, public y: number = 0) { }
}
export class Coordinates3D {
    constructor(public x: number = 0, public y: number = 0, public z: number = 0) { }
}
/**
 * @deprecated prefer ILevelLocation2 instead
 */
export interface ILevelLocation {
    getX(): number;
    getY(): number;
    getZ(): number;
    getLevel(): Level;
}
export interface ILevelLocation2 {
    x: number;
    y: number;
    z: number;
    level: Level;
}
export function copyLocation(location: splitTime.ILevelLocation2) {
    return {
        level: location.level,
        x: location.x,
        y: location.y,
        z: location.z
    };
}
export function areCoordinatesEquivalent(coords1: Readonly<splitTime.Coordinates2D>, coords2: Readonly<splitTime.Coordinates2D>): boolean;
export function areCoordinatesEquivalent(coords1: Readonly<splitTime.Coordinates3D>, coords2: Readonly<splitTime.Coordinates3D>): boolean;
export function areCoordinatesEquivalent(coords1: Readonly<splitTime.Coordinates3D> | Readonly<splitTime.Coordinates2D>, coords2: Readonly<splitTime.Coordinates3D> | Readonly<splitTime.Coordinates2D>): boolean {
    return coords1.x === coords2.x &&
        coords1.y === coords2.y &&
        // TODO: This check falls apart for mixed types
        (coords1 as Readonly<splitTime.Coordinates3D>).z === (coords2 as Readonly<splitTime.Coordinates3D>).z;
}
export function areLocationsEquivalent(location1: splitTime.ILevelLocation2, location2: splitTime.ILevelLocation2) {
    return location1.level === location2.level &&
        location1.x === location2.x &&
        location1.y === location2.y &&
        location1.z === location2.z;
}
/**
 * @deprecated
 */
export class Location implements splitTime.ILevelLocation {
    constructor(public readonly x: number, public readonly y: number, public readonly z: number, public readonly level: Level) { }
    getX(): number {
        return this.x;
    }
    getY(): number {
        return this.y;
    }
    getZ(): number {
        return this.z;
    }
    getLevel(): Level {
        return this.level;
    }
}
export function instanceOfCoordinates2D(thing: unknown): thing is splitTime.Coordinates2D {
    const coords = thing as Readonly<splitTime.Coordinates2D>;
    return !!thing && typeof coords.x === "number" && typeof coords.y === "number";
}
export function instanceOfILevelLocation(thing: unknown): thing is splitTime.ILevelLocation {
    const location = thing as splitTime.ILevelLocation;
    return !!thing &&
        typeof location.getX === "function" &&
        typeof location.getY === "function" &&
        typeof location.getZ === "function" &&
        typeof location.getLevel === "function";
}
export function instanceOfILevelLocation2(thing: unknown): thing is splitTime.ILevelLocation2 {
    const location = thing as splitTime.ILevelLocation2;
    return !!thing &&
        typeof location.x === "number" &&
        typeof location.y === "number" &&
        typeof location.z === "number" &&
        location.level instanceof Level;
}
