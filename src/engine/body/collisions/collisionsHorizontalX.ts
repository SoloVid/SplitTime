// NOTE: This file has a sister that is nearly identical: collisionsHorizontalY.js
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

    export class HorizontalX {
        constructor(private readonly mover: SplitTime.body.Mover) {
        }
        
        /**
        * Check that dx can be accomplished, potentially with vertical adjustment.
        */
        calculateXPixelCollisionWithStepUp(x: int, y: int, z: number, dx: unit): CollisionInfo {
            var collisionInfo = new CollisionInfo(z);
            
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
        */
        calculateXPixelCollision(level: SplitTime.Level, x: int, y: int, z: number, dx: unit): { blocked: boolean; bodies: SplitTime.Body[]; vStepUpEstimate: number; events: string[]; otherLevels: string[]; } {
            var edgeX = dx > 0 ? x + dx + this.mover.body.halfBaseLength : x + dx - this.mover.body.halfBaseLength;
            var top = y - this.mover.body.halfBaseLength;
            return SplitTime.COLLISION_CALCULATOR.calculateVolumeCollision(level, edgeX, 1, top, this.mover.body.baseLength, Math.round(z), Math.round(this.mover.body.height));
        };
    }
}
