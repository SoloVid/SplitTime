namespace splitTime {

    export class Npc {

        public readonly movementAgent: agent.ControlledCollisionMovement

        constructor(
            public readonly spriteBody: SpriteBody,
            public behavior: npc.BehaviorChoice = new npc.BehaviorChoice()
        ) {
            this.movementAgent = new agent.ControlledCollisionMovement(spriteBody)
        }

        get body(): Body {
            return this.spriteBody.body
        }

        get sprite(): Sprite {
            return this.spriteBody.sprite
        }
    }
}