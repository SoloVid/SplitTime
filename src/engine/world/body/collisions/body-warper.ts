import { getXMagnitude, getYMagnitude } from "../../../math/direction";
import { forEachPoint, ReturnCode } from "../../../math/bresenham";
import { isPointerOffsetSignificant, PointerOffset } from "../../level/trace/trace";
import { COLLISION_CALCULATOR, int } from "../../../splitTime";
import { Transporter } from "./body-transporter";
import { distanceTrue } from "../../../math/measurement";
import * as splitTime from "../../../splitTime";
export class Warper {
    constructor(private readonly body: splitTime.Body) {
    }
    /**
     * Check that body is in current region
     */
    ensureInRegion() {
        // TODO: maybe reimplement?
        // if(this.body.getLevel().getRegion() !== splitTime.Region.getCurrent()) {
        //     throw new Error("Attempt to do zelda movement for body not in current region");
        // }
    }
    /**
     * Advances splitTime.Body up to maxDistance pixels as far as is legal.
     * Includes pushing other Bodys out of the way? (this part is currently unavailable)
     * @param {number} dir
     * @param {number} maxDistance
     * @returns {number} distance actually moved
     */
    warp(dir: number, maxDistance: number): number {
        this.ensureInRegion();
        const level = this.body.level;
        const width = this.body.width;
        const depth = this.body.depth;
        const startX = Math.round(this.body.x);
        const startY = Math.round(this.body.y);
        const z = Math.round(this.body.z);
        const furthestX = Math.round(this.body.x +
            maxDistance * getXMagnitude(dir));
        const furthestY = Math.round(this.body.y +
            maxDistance * getYMagnitude(dir));
        let toX: number | null = null;
        let toY: number | null = null;
        let mightMoveLevels = false;
        const me = this;
        forEachPoint(furthestX, furthestY, startX, startY, (x, y) => {
            if (x + width / 2 >= level.width ||
                x - width / 2 < 0) {
                return;
            }
            if (y + depth / 2 >= level.yWidth ||
                y - depth / 2 < 0) {
                return;
            }
            var collisionInfo = me._getCollisionInfoAt(x, y, z);
            if (!collisionInfo.blocked) {
                if (toX === null) {
                    toX = x;
                    toY = y;
                    if (isPointerOffsetSignificant(collisionInfo.targetOffset, level)) {
                        mightMoveLevels = true;
                    }
                }
                return ReturnCode.EXIT_EARLY;
            }
            return;
        });
        if (toX !== null &&
            toY !== null &&
            (Math.abs(toX - startX) > width ||
                Math.abs(toY - startY) > depth)) {
            this.body.put(level, toX, toY, z);
            const events = COLLISION_CALCULATOR.getEventsInVolume(level, this.body.getLeft(), this.body.width, this.body.getTopY(), this.body.depth, this.body.z, this.body.height);
            level.runEvents(events, this.body);
            if (mightMoveLevels) {
                var transporter = new Transporter(this.body);
                transporter.transportLevelIfApplicable();
            }
            return distanceTrue(startX, startY, toX, toY);
        }
        else {
            return 0;
        }
    }
    private _getCollisionInfoAt(x: int, y: int, z: int): {
        blocked: boolean;
        targetOffset: PointerOffset | null;
    } {
        var left = x - this.body.width / 2;
        var top = y - this.body.depth / 2;
        const originCollisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(this.body.collisionMask, this.body.level, left, this.body.width, top, this.body.depth, z, this.body.height, [this.body]);
        return {
            blocked: originCollisionInfo.blocked && originCollisionInfo.zBlockedTopEx !== z,
            targetOffset: originCollisionInfo.targetOffset
        };
    }
}
