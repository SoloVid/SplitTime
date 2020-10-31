namespace splitTime {

    export class Npc {

        public readonly movementAgent: agent.BestEffortMovementAgent

        constructor(
            public readonly spriteBody: SpriteBody,
            public behavior: npc.BehaviorChoice = new npc.BehaviorChoice()
        ) {
            this.movementAgent = new agent.BestEffortMovementAgent(spriteBody)
        }

        get body(): Body {
            return this.spriteBody.body
        }

        get sprite(): Sprite {
            return this.spriteBody.sprite
        }
    }
}