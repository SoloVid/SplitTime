namespace splitTime.player {
    const ATTACK_ABILITY = "ATTACK_ABILITY"
    const JUMP_ABILITY = "JUMP_ABILITY"
    const SPECIAL_ABILITY = "SPECIAL_ABILITY"

    export class PlayerAgent implements splitTime.TimeNotified {
        readonly abilities: ability.AbilityPool
        movementAgent: splitTime.agent.ControlledCollisionMovement
        speed: Indirect<number> = 32
        walkStance: string = "walk"
        readonly locationHistory = new LocationHistory(128)

        constructor(
            private readonly playerManager: PlayerManager,
            private readonly joyStick: controls.JoyStick,
            readonly spriteBody: splitTime.SpriteBody,
            readonly stamina: MeteredStat | null = null
        ) {
            this.abilities = new ability.AbilityPool(spriteBody.body)
            this.movementAgent = new splitTime.agent.ControlledCollisionMovement(
                spriteBody
            )
        }

        get body(): Body {
            return this.spriteBody.body
        }

        setJumpAbility(ability: ability.IAbility) {
            this.abilities.set(JUMP_ABILITY, ability, 0.0)
        }

        setSpecialAbility(ability: ability.IAbility) {
            this.abilities.set(SPECIAL_ABILITY, ability, 0.1)
        }

        setAttackAbility(ability: ability.IAbility) {
            this.abilities.set(ATTACK_ABILITY, ability, 0.1)
        }

        doJump() {
            this.useAbility(JUMP_ABILITY)
        }
        doSpecial() {
            this.useAbility(SPECIAL_ABILITY)
        }
        doAttack() {
            this.useAbility(ATTACK_ABILITY)
        }

        useAbility(ability: string): void {
            if (!this.isFrozen()) {
                this.abilities.use(ability)
            }
        }

        setLadder(eventId: string, direction: splitTime.direction_t) {
            this.movementAgent.setLadder(eventId, direction)
        }

        isFrozen(): boolean {
            return this.playerManager.controlsLocked || this.abilities.isFrozen() || (this.stamina !== null && this.stamina.isEmpty())
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
                this.movementAgent.speed = this.speed
                this.movementAgent.stance = this.walkStance
            }

            if (!this.isFrozen() && this.spriteBody.body.getLevel().isLoaded()) {
                this.movementAgent.notifyTimeAdvance(delta)
            }

            this.locationHistory.push(this.body)
        }
    }
}
