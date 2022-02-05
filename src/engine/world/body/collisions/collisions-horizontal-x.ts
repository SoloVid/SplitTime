import { Mover } from "./body-mover";
import { Level, COLLISION_CALCULATOR } from "../../../splitTime";
import { HorizontalCollisionInfo } from "./collisions-horizontal";
import { PointerOffset } from "../../level/trace/trace";
import * as splitTime from "../../../splitTime";
// NOTE: This file has a sister that is nearly identical: collisionsHorizontalY.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.
export class HorizontalX {
    constructor(private readonly mover: Mover) { }
    /**
     * Check that dx can be accomplished, potentially with vertical adjustment.
     */
    calculateXPixelCollisionWithStepUp(level: Level, x: number, y: number, z: number, dx: number): HorizontalCollisionInfo {
        var collisionInfo = new HorizontalCollisionInfo(z);
        var simpleCollisionInfo = this.calculateXPixelCollision(level, x, y, z, dx);
        if (simpleCollisionInfo.blocked &&
            simpleCollisionInfo.vStepUpEstimate <=
                Mover.VERTICAL_FUDGE) {
            const stepUpCollisionInfo = this.mover.vertical.calculateZCollision(level, x + dx, y, z, Mover.VERTICAL_FUDGE);
            const stepUpZ = z + stepUpCollisionInfo.dzAllowed;
            var simpleStepUpCollisionInfo = this.calculateXPixelCollision(level, x, y, stepUpZ, dx);
            if (!simpleStepUpCollisionInfo.blocked) {
                const backDownCollisionInfo = this.mover.vertical.calculateZCollision(level, x + dx, y, stepUpZ, -Mover.VERTICAL_FUDGE);
                collisionInfo.adjustedZ = stepUpZ + backDownCollisionInfo.dzAllowed;
                simpleCollisionInfo = simpleStepUpCollisionInfo;
            }
        }
        collisionInfo.blocked = simpleCollisionInfo.blocked;
        collisionInfo.bodies = simpleCollisionInfo.bodies;
        collisionInfo.events = simpleCollisionInfo.events;
        collisionInfo.targetOffset = simpleCollisionInfo.targetOffset;
        return collisionInfo;
    }
    /**
     * Check that dx can be accomplished.
     */
    calculateXPixelCollision(level: Level, x: number, y: number, z: number, dx: number): {
        blocked: boolean;
        bodies: splitTime.Body[];
        vStepUpEstimate: number;
        events: string[];
        targetOffset: PointerOffset | null;
    } {
        var edgeX = dx > 0
            ? x + dx + this.mover.body.width / 2
            : x + dx - this.mover.body.width / 2;
        var top = y - this.mover.body.depth / 2;
        const solidCollisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(this.mover.body.collisionMask, level, edgeX, Math.abs(dx), top, this.mover.body.depth, z, this.mover.body.height);
        const events = COLLISION_CALCULATOR.getEventsInVolume(level, edgeX, Math.abs(dx), top, this.mover.body.depth, z, this.mover.body.height);
        return {
            ...solidCollisionInfo,
            events: events
        };
    }
}
