namespace splitTime.player {
    const ATTACK_ABILITY = "ATTACK_ABILITY"
    const JUMP_ABILITY = "JUMP_ABILITY"
    const SPECIAL_ABILITY = "SPECIAL_ABILITY"

    export class PlayerAgent implements splitTime.TimeNotified {
        readonly abilities: ability.AbilityPool
        movementAgent: splitTime.agent.ControlledCollisionMovement

        constructor(
            private readonly playerManager: PlayerManager,
            private readonly joyStick: controls.JoyStick,
            readonly body: splitTime.Body,
            readonly stamina: Stamina | null = null
        ) {
            this.abilities = new ability.AbilityPool(body)
            this.movementAgent = new splitTime.agent.ControlledCollisionMovement(
                body
            )
        }

        setJumpAbility(ability: ability.IAbility) {
            this.abilities.set(JUMP_ABILITY, ability, 0.1)
        }

        setSpecialAbility(ability: ability.IAbility) {
            this.abilities.set(SPECIAL_ABILITY, ability, 0.1)
        }

        setAttackAbility(ability: ability.IAbility) {
            this.abilities.set(ATTACK_ABILITY, ability, 0.1)
        }

        doJump() {
            this.abilities.use(JUMP_ABILITY)
        }
        doSpecial() {
            this.abilities.use(SPECIAL_ABILITY)
        }
        doAttack() {
            this.abilities.use(ATTACK_ABILITY)
        }

        setLadder(eventId: string, direction: splitTime.direction_t) {
            this.movementAgent.setLadder(eventId, direction)
        }

        isFrozen(): boolean {
            return this.abilities.isFrozen() || (this.stamina !== null && !this.stamina.isConscious())
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
