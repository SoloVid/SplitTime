namespace splitTime {
    export class Npc implements splitTime.TimeNotified {

        // TODO: encapsulate stats (e.g. speed) at this level
        // e.g. wandering
        private idleBehavior: splitTime.TimeNotified | null = null
        // e.g. path-walking
        private directedBehavior: splitTime.TimeNotified | null = null
        // e.g. talking / attacking
        private priorityBehavior: splitTime.TimeNotified | null = null

        public readonly movementAgent: agent.BestEffortMovementAgent

        constructor(
            public readonly body: Body
        ) {
            this.movementAgent = new agent.BestEffortMovementAgent(body)
        }

        notifyTimeAdvance(delta: number): void {
            if (this.priorityBehavior !== null) {
                this.priorityBehavior.notifyTimeAdvance(delta)
                return
            }
            if (this.directedBehavior !== null) {
                this.directedBehavior.notifyTimeAdvance(delta)
                return
            }
            if (this.idleBehavior !== null) {
                this.idleBehavior.notifyTimeAdvance(delta)
                return
            }
        }

        stopBehavior(behavior: splitTime.TimeNotified): void {
            if (this.priorityBehavior === behavior) {
                this.priorityBehavior = null
            }
            if (this.directedBehavior === behavior) {
                this.directedBehavior = null
            }
            if (this.idleBehavior === behavior) {
                this.idleBehavior = null
            }
        }

        setIdleBehavior(behavior: splitTime.TimeNotified): void {
            this.idleBehavior = behavior
        }

        setDirectedBehavior(behavior: splitTime.TimeNotified): void {
            this.directedBehavior = behavior
        }

        setPriorityBehavior(behavior: splitTime.TimeNotified): void {
            this.priorityBehavior = behavior
        }
    }
}