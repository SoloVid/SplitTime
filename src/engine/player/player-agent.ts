namespace splitTime.player {
    export class PlayerAgent implements splitTime.TimeNotified {
        movementAgent: splitTime.agent.ControlledCollisionMovement
        private freezeUntil: splitTime.game_seconds
        jumpAbility: ability.IAbility | null
        jumpCooldown: splitTime.game_seconds
        specialAbility: ability.IAbility | null
        specialCooldown: splitTime.game_seconds
        attackAbility: ability.IAbility | null

        constructor(
            private readonly playerManager: PlayerManager,
            private readonly joyStick: controls.JoyStick,
            readonly body: splitTime.Body,
            readonly stamina: Stamina | null = null
        ) {
            this.movementAgent = new splitTime.agent.ControlledCollisionMovement(
                body
            )
            this.freezeUntil = Number.NEGATIVE_INFINITY
            this.jumpAbility = null
            this.jumpCooldown = 0.1
            this.specialAbility = null
            this.specialCooldown = 0.1
            this.attackAbility = null
        }

        setJumpAbility(ability: ability.IAbility) {
            this.jumpAbility = ability
        }

        setSpecialAbility(ability: ability.IAbility) {
            this.specialAbility = ability
        }

        setAttackAbility(ability: ability.IAbility) {
            this.attackAbility = ability
        }

        doJump() {
            if (!this.isFrozen() && this.jumpAbility) {
                this.jumpAbility.use()
                // this.freezeUntil = this.body.getLevel().getRegion().getTime() + this.jumpCooldown;
            }
        }
        doSpecial() {
            if (!this.isFrozen() && this.specialAbility) {
                var used = this.specialAbility.use()
                if (used) {
                    this.freezeUntil =
                        this.body
                            .getLevel()
                            .getRegion()
                            .getTime() + this.specialCooldown
                }
            }
        }
        doAttack() {
            if (!this.isFrozen() && this.attackAbility) {
                this.attackAbility.use()
            }
        }

        setLadder(eventId: string, direction: splitTime.direction_t) {
            this.movementAgent.setLadder(eventId, direction)
        }

        isFrozen(): boolean {
            const level = this.body.getLevel()
            const now = level.getRegion().getTime()
            return now <= this.freezeUntil || (this.stamina !== null && !this.stamina.isConscious())
        }

        notifyTimeAdvance(delta: splitTime.game_seconds) {
            if (this !== this.playerManager.getActive()) {
                this.movementAgent.setStopped()
                return
            }

            var dir = this.joyStick.getDirection()
            if (dir === null) {
                this.movementAgent.setStopped()
            } else {
                this.movementAgent.setWalkingDirection(dir)
            }

            if (!this.isFrozen() && this.body.getLevel().isLoaded()) {
                this.movementAgent.notifyTimeAdvance(delta)
            }
        }
    }
}
