namespace splitTime.player.ability {
    export class Jump implements IAbility {
        body: splitTime.Body
        zVelocity: number
        /**
         * @param {splitTime.Body} body
         * @param {number} zVelocity initial z velocity (560 is a good value)
         * @implements {G.Ability}
         */
        private constructor(body: splitTime.Body, zVelocity: number) {
            this.body = body
            this.zVelocity = zVelocity
        }

        static fromMaxHeight(body: splitTime.Body, approxMaxHeight: number): Jump {
            // Solving x = 1/2 * a * t^2 + v0 * t + x0
            const timeToReachMax = Math.sqrt(approxMaxHeight / (0.5 * Math.abs(body.GRAVITY)))
            const initialVelocity = Math.abs(body.GRAVITY) * timeToReachMax
            return new Jump(body, initialVelocity)
        }

        use(): boolean {
            var fallCollisionInfo = this.body.mover.vertical.calculateZCollision(
                this.body.level, this.body.x, this.body.y, this.body.z, -1
            )
            if (fallCollisionInfo.dzAllowed === 0) {
                this.body.zVelocity = this.zVelocity
                return true
            }
            return false
        }
    }
}
