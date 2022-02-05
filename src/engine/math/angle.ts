import { Vector2D } from "../splitTime";
export function angleBetween(v1: Vector2D, v2: Vector2D, vRef: Vector2D = new Vector2D()): number {
    const v1Rel = v1.plus(vRef.times(-1));
    const v2Rel = v2.plus(vRef.times(-1));
    return Math.acos(v1Rel.dot(v2Rel) / (v1Rel.magnitude * v2Rel.magnitude));
}
export function angleBisector(v1: Vector2D, v2: Vector2D, vRef: Vector2D = new Vector2D()): Vector2D {
    const v1Rel = v1.plus(vRef.times(-1));
    const v2Rel = v2.plus(vRef.times(-1));
    return v1Rel.times(v2Rel.magnitude).plus(v2Rel.times(v1Rel.magnitude));
}
