import { Mover } from "./body-mover";
import { Level, COLLISION_CALCULATOR } from "../../../splitTime";
import { HorizontalCollisionInfo } from "./collisions-horizontal";
import { PointerOffset } from "../../level/trace/trace";
import * as splitTime from "../../../splitTime";
// NOTE: This file has a sister that is nearly identical: collisionsHorizontalX.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.
export class HorizontalY {
    constructor(private readonly mover: Mover) { }
    /**
     * Check that dy can be accomplished, potentially with vertical adjustment.
     */
    calculateYPixelCollisionWithStepUp(level: Level, x: number, y: number, z: number, dy: number): HorizontalCollisionInfo {
        var collisionInfo = new HorizontalCollisionInfo(z);
        var simpleCollisionInfo = this.calculateYPixelCollision(level, x, y, z, dy);
        if (simpleCollisionInfo.blocked &&
            simpleCollisionInfo.vStepUpEstimate <=
                Mover.VERTICAL_FUDGE) {
            const stepUpCollisionInfo = this.mover.vertical.calculateZCollision(level, x, y + dy, z, Mover.VERTICAL_FUDGE);
            const stepUpZ = z + stepUpCollisionInfo.dzAllowed;
            var simpleStepUpCollisionInfo = this.calculateYPixelCollision(level, x, y, stepUpZ, dy);
            if (!simpleStepUpCollisionInfo.blocked) {
                const backDownCollisionInfo = this.mover.vertical.calculateZCollision(level, x, y + dy, stepUpZ, -Mover.VERTICAL_FUDGE);
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
     * Check that dy can be accomplished.
     */
    calculateYPixelCollision(level: Level, x: number, y: number, z: number, dy: number): {
        blocked: boolean;
        bodies: splitTime.Body[];
        vStepUpEstimate: number;
        events: string[];
        targetOffset: PointerOffset | null;
    } {
        var edgeY = dy > 0
            ? y + dy + this.mover.body.depth / 2
            : y + dy - this.mover.body.depth / 2;
        var left = x - this.mover.body.width / 2;
        const solidCollisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(this.mover.body.collisionMask, level, left, this.mover.body.width, edgeY, Math.abs(dy), z, this.mover.body.height);
        const events = COLLISION_CALCULATOR.getEventsInVolume(level, left, this.mover.body.width, edgeY, Math.abs(dy), z, this.mover.body.height);
        return {
            ...solidCollisionInfo,
            events: events
        };
    }
}
