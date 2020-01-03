// NOTE: This file has a sister that is nearly identical: collisionsHorizontalX.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

namespace SplitTime.body.collisions {
    export class HorizontalY {
        mover: Mover;
        constructor(mover: SplitTime.body.Mover) {
            this.mover = mover;
        }
        
        /**
        * Check that dy can be accomplished, potentially with vertical adjustment.
        * @param {int} x
        * @param {int} y
        * @param {number} z
        * @param {int} dy should be -1 or 1
        * @returns {{blocked: boolean, bodies: SplitTime.Body[], adjustedZ: number, events: string[], otherLevels: string[]}}
        */
        calculateYPixelCollisionWithStepUp(x, y, z, dy) {
            var collisionInfo = {
                blocked: false,
                bodies: [],
                adjustedZ: z,
                events: [],
                otherLevels: []
            };
            
            var simpleCollisionInfo = this.calculateYPixelCollision(this.mover.body.getLevel(), x, y, z, dy);
            if(simpleCollisionInfo.blocked && simpleCollisionInfo.vStepUpEstimate <= SplitTime.body.Mover.VERTICAL_FUDGE) {
                var stepUpZ = this.mover.rising.calculateRiseThroughTraces(x, y + dy, z, SplitTime.body.Mover.VERTICAL_FUDGE).zEnd;
                var simpleStepUpCollisionInfo = this.calculateYPixelCollision(this.mover.body.getLevel(), x, y, stepUpZ, dy);
                if(!simpleStepUpCollisionInfo.blocked) {
                    collisionInfo.adjustedZ = this.mover.falling.calculateDropThroughTraces(x, y + dy, stepUpZ, SplitTime.body.Mover.VERTICAL_FUDGE).zBlocked;
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
        * Check that dy can be accomplished.
        * @param {SplitTime.Level} level
        * @param {int} x
        * @param {int} y
        * @param {number} z
        * @param {int} dy should be -1 or 1
        * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, events: string[]}}
        */
        calculateYPixelCollision(level, x, y, z, dy) {
            var edgeY = dy > 0 ? y + dy + this.mover.body.halfBaseLength : y + dy - this.mover.body.halfBaseLength;
            var left = x - this.mover.body.halfBaseLength;
            return SplitTime.COLLISION_CALCULATOR.calculateVolumeCollision(level, left, this.mover.body.baseLength, edgeY, 1, Math.round(z), Math.round(this.mover.body.height));
        };
    }
}