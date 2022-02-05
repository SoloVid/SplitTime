import { Vector2D } from "../splitTime";
export type pixels_t = number;
export function distanceEasy(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
export function distanceTrue(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
export function midpoint(v1: Vector2D, v2: Vector2D): Vector2D {
    return new Vector2D((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
}
export type unit = -1 | 1;
export type unitOrZero = unit | 0;
