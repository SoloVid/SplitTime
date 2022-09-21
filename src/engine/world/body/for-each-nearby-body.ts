import { CollisionMask, pixels_t } from "../../splitTime";
import * as splitTime from "../../splitTime";
export function forEachNearbyBody(collisionMask: CollisionMask, body: splitTime.Body, dist: pixels_t, callback: (arg0: splitTime.Body) => void): void {
    const left = body.getLeft();
    const top = body.getTopY();
    body.level.getCellGrid().forEachBody(collisionMask, left - dist, top - dist, body.z - dist, left + body.width + dist, top + body.depth + dist, body.z + body.height + dist, callback);
}
