import { Vector2D } from "engine/math/vector2d";
import { World } from "engine/world/world";
import { Level } from "../level";
import { Position } from "../position";
import { TraceSpec } from "./trace-spec";

export interface PointerOffset {
    readonly level: Level;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly offsetZ: number;
    getOffsetHash(): string;
}
export function isPointerOffsetSignificant(pointerOffset: PointerOffset | null, startLevel: Level): boolean {
    if (pointerOffset === null) {
        return false;
    }
    if (pointerOffset.level !== startLevel) {
        return true;
    }
    return pointerOffset.offsetX !== 0 || pointerOffset.offsetY !== 0 || pointerOffset.offsetZ !== 0;
}
export class Trace {
    // vertices: Coordinates2D[] = []
    private _level: Level | null = null;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly offsetZ: number;
    constructor(readonly spec: TraceSpec) {
        this.offsetX = this.spec.linkOffsetX;
        this.offsetY = this.spec.linkOffsetY;
        this.offsetZ = this.spec.linkOffsetZ;
    }
    load(level: Level, world: World) {
        this._level = this.spec.linkLevel ? world.getLevel(this.spec.linkLevel) : null;
    }
    getPointerOffset(): PointerOffset {
        return this as PointerOffset;
    }
    get level(): Level {
        if (this._level === null) {
            throw new Error("Trace isn't loaded; so the level can't be accessed");
        }
        return this._level;
    }
    getLevel(): Level {
        if (!this.level) {
            throw new Error("Trace does not have a Level");
        }
        return this.level;
    }
    getTargetPosition(): Position {
        if (!this.spec.linkPosition) {
            throw new Error("Trace does not have a target Position");
        }
        return this.getLevel().getPosition(this.spec.linkPosition);
    }
    getOffsetHash() {
        return this.spec.getOffsetHash();
    }
    calculateStairsExtremes(): {
        top: Vector2D;
        bottom: Vector2D;
    } {
        return this.spec.calculateStairsExtremes();
    }
}
