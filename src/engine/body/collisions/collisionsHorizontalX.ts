// NOTE: This file has a sister that is nearly identical: collisionsHorizontalY.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

namespace SplitTime.body.collisions {
    export class HorizontalX {
        mover: Mover;
        constructor(mover: SplitTime.body.Mover) {
            this.mover = mover;
        }
        
        /**
        * Check that dx can be accomplished, potentially with vertical adjustment.
        * @param {int} x
        * @param {int} y
        * @param {number} z
        * @param {int} dx should be -1 or 1
        * @returns {{blocked: boolean, bodies: SplitTime.Body[], adjustedZ: number, events: string[], otherLevels: string[]}}
        */
        calculateXPixelCollisionWithStepUp(x, y, z, dx) {
            var collisionInfo = {
                blocked: false,
                bodies: [],
                adjustedZ: z,
                events: [],
                otherLevels: []
            };
            
            var simpleCollisionInfo = this.calculateXPixelCollision(this.mover.body.getLevel(), x, y, z, dx);
            if(simpleCollisionInfo.blocked && simpleCollisionInfo.vStepUpEstimate <= SplitTime.body.Mover.VERTICAL_FUDGE) {
                var stepUpZ = this.mover.rising.calculateRiseThroughTraces(x + dx, y, z, SplitTime.body.Mover.VERTICAL_FUDGE).zEnd;
                var simpleStepUpCollisionInfo = this.calculateXPixelCollision(this.mover.body.getLevel(), x, y, stepUpZ, dx);
                if(!simpleStepUpCollisionInfo.blocked) {
                    collisionInfo.adjustedZ = this.mover.falling.calculateDropThroughTraces(x + dx, y, stepUpZ, SplitTime.body.Mover.VERTICAL_FUDGE).zBlocked;
                    simpleCollisionInfo = simpleStepUpCollisionInfo;
                }
            }
            collisionInfo.blocked = simpleCollisionInfo.blocked;
            collisionInfo.bodies = simpleCollisionInfo.bodies;
            collisionInfo.events = simpleCollisionInfo.events;
            collisionInfo.otherLevels = simpleCollisionInfo.otherLevels;
            
            return collisionInfo;
        };
        
        /**
        * Check that dx can be accomplished.
        * @param {SplitTime.Level} level
        * @param {int} x
        * @param {int} y
        * @param {number} z
        * @param {int} dx should be -1 or 1
        * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, events: string[], otherLevels: string[]}}
        */
        calculateXPixelCollision(level, x, y, z, dx) {
            var edgeX = dx > 0 ? x + dx + this.mover.halfBaseLength : x + dx - this.mover.halfBaseLength;
            var top = y - this.mover.halfBaseLength;
            return SplitTime.COLLISION_CALCULATOR.calculateVolumeCollision(level, edgeX, 1, top, this.mover.baseLength, Math.round(z), Math.round(this.mover.height));
        };
    }
}
