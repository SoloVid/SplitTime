import { Vector2D } from "../../splitTime";
import { Polygon } from "./polygon";
interface XExtremes {
    left: Vector2D;
    right: Vector2D;
}
/**
 * Get the two vertices of the polygon that are
 * furthest left and right
 */
export function getXExtremes(p: Polygon): XExtremes {
    return {
        left: p.vertices.reduce((leftMost, next) => {
            return leftMost.x < next.x ? leftMost : next;
        }, p.vertices[0]),
        right: p.vertices.reduce((rightMost, next) => {
            return rightMost.x > next.x ? rightMost : next;
        }, p.vertices[0])
    };
}
