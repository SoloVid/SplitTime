namespace splitTime {

    export class Npc {

        public readonly movementAgent: agent.BestEffortMovementAgent

        constructor(
            public readonly body: Body,
            public behavior: npc.BehaviorChoice = new npc.BehaviorChoice()
        ) {
            this.movementAgent = new agent.BestEffortMovementAgent(body)
        }
    }
}