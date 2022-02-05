import { math, Coordinates2D } from "../splitTime";
export class Rect {
    private _x: number = 0;
    private _y: number = 0;
    private _width: number = 0;
    private _height: number = 0;
    private constructor() { }
    public static make(x: number, y: number, width: number, height: number): Rect {
        const rect = new Rect();
        rect.x = x;
        rect.y = y;
        rect.width = width;
        rect.height = height;
        return rect;
    }
    get x(): number {
        return this._x;
    }
    set x(val: number) {
        this._x = val;
    }
    get y(): number {
        return this._y;
    }
    set y(val: number) {
        this._y = val;
    }
    get width(): number {
        return this._width;
    }
    set width(val: number) {
        this._width = val;
    }
    get height(): number {
        return this._height;
    }
    set height(val: number) {
        this._height = val;
    }
    get x2(): number {
        return this._x + this._width;
    }
    set x2(val: number) {
        this._width = val - this._x;
    }
    get y2(): number {
        return this._y + this._height;
    }
    set y2(val: number) {
        this._height = val - this._y;
    }
    copy(): Rect {
        return Rect.make(this.x, this.y, this.width, this.height);
    }
}
export function calculateTotalRectArea(rects: Rect[]): Rect {
    let lowX = Number.POSITIVE_INFINITY;
    let highX = Number.NEGATIVE_INFINITY;
    let lowY = Number.POSITIVE_INFINITY;
    let highY = Number.NEGATIVE_INFINITY;
    for (const rect of rects) {
        lowX = Math.min(lowX, rect.x);
        highX = Math.max(highX, rect.x2);
        lowY = Math.min(lowY, rect.y);
        highY = Math.max(highY, rect.y2);
    }
    return math.Rect.make(lowX, lowY, highX - lowX, highY - lowY);
}
export function calculateTotalArea(points: Coordinates2D[]): Rect {
    let lowX = Number.POSITIVE_INFINITY;
    let highX = Number.NEGATIVE_INFINITY;
    let lowY = Number.POSITIVE_INFINITY;
    let highY = Number.NEGATIVE_INFINITY;
    for (const p of points) {
        lowX = Math.min(lowX, p.x);
        highX = Math.max(highX, p.x);
        lowY = Math.min(lowY, p.y);
        highY = Math.max(highY, p.y);
    }
    return math.Rect.make(lowX, lowY, highX - lowX, highY - lowY);
}
