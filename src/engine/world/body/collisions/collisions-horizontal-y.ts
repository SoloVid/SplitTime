// NOTE: This file has a sister that is nearly identical: collisionsHorizontalX.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

namespace splitTime.body.collisions {
    export class HorizontalY {
        constructor(private readonly mover: splitTime.body.Mover) {}

        /**
         * Check that dy can be accomplished, potentially with vertical adjustment.
         */
        calculateYPixelCollisionWithStepUp(
            level: Level,
            x: number,
            y: number,
            z: number,
            dy: number
        ): HorizontalCollisionInfo {
            var collisionInfo = new HorizontalCollisionInfo(z)
    
            var simpleCollisionInfo = this.calculateYPixelCollision(level, x, y, z, dy)
            if (
                simpleCollisionInfo.blocked &&
                simpleCollisionInfo.vStepUpEstimate <=
                    splitTime.body.Mover.VERTICAL_FUDGE
            ) {
                const stepUpCollisionInfo = this.mover.vertical.calculateZCollision(
                    level, x, y + dy, z,
                    splitTime.body.Mover.VERTICAL_FUDGE
                )
                const stepUpZ = z + stepUpCollisionInfo.dzAllowed
                var simpleStepUpCollisionInfo = this.calculateYPixelCollision(
                    level, x, y, stepUpZ, dy
                )
                if (!simpleStepUpCollisionInfo.blocked) {
                    const backDownCollisionInfo = this.mover.vertical.calculateZCollision(
                        level,
                        x,
                        y + dy,
                        stepUpZ,
                        -splitTime.body.Mover.VERTICAL_FUDGE
                    )
                    collisionInfo.adjustedZ = stepUpZ + backDownCollisionInfo.dzAllowed
                    simpleCollisionInfo = simpleStepUpCollisionInfo
                }
            }
            collisionInfo.blocked = simpleCollisionInfo.blocked
            collisionInfo.bodies = simpleCollisionInfo.bodies
            collisionInfo.events = simpleCollisionInfo.events
            collisionInfo.targetLevel = simpleCollisionInfo.targetLevel

            return collisionInfo
        }

        /**
         * Check that dy can be accomplished.
         */
        calculateYPixelCollision(
            level: splitTime.Level,
            x: number,
            y: number,
            z: number,
            dy: number
        ): {
            blocked: boolean
            bodies: splitTime.Body[]
            vStepUpEstimate: number
            events: string[]
            targetLevel: Level
        } {
            var edgeY =
                dy > 0
                    ? y + dy + this.mover.body.halfBaseLength
                    : y + dy - this.mover.body.halfBaseLength
            var left = x - this.mover.body.halfBaseLength
            return splitTime.COLLISION_CALCULATOR.calculateVolumeCollision(
                level,
                left,
                this.mover.body.baseLength,
                edgeY,
                Math.abs(dy),
                z,
                this.mover.body.height
            )
        }
    }
}
