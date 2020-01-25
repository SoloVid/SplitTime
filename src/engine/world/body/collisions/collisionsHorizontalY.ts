// NOTE: This file has a sister that is nearly identical: collisionsHorizontalX.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

namespace SplitTime.body.collisions {
    class CollisionInfo {
        blocked: boolean = false;
        bodies: Body[] = [];
        adjustedZ: number;
        events: string[] = [];
        otherLevels: string[] = [];

        constructor(z: number) {
            this.adjustedZ = z;
        }
    }

    export class HorizontalY {
        constructor(private readonly mover: SplitTime.body.Mover) {
        }
        
        /**
        * Check that dy can be accomplished, potentially with vertical adjustment.
        */
        calculateYPixelCollisionWithStepUp(x: int, y: int, z: number, dy: unit): CollisionInfo {
            var collisionInfo = new CollisionInfo(z);
            
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
        */
       calculateYPixelCollision(level: SplitTime.Level, x: int, y: int, z: number, dy: unit): { blocked: boolean; bodies: SplitTime.Body[]; vStepUpEstimate: number; events: string[]; otherLevels: string[]; } {
        var edgeY = dy > 0 ? y + dy + this.mover.body.halfBaseLength : y + dy - this.mover.body.halfBaseLength;
            var left = x - this.mover.body.halfBaseLength;
            return SplitTime.COLLISION_CALCULATOR.calculateVolumeCollision(level, left, this.mover.body.baseLength, edgeY, 1, Math.round(z), Math.round(this.mover.body.height));
        };
    }
}