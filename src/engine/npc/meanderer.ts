namespace splitTime.agent {
    enum MeanderState {
        WAITING = "WAITING",
        WALKING = "WALKING"
    }

    export function makeMeanderingBehavior(npc: Npc, home: ILevelLocation2): npc.Behavior {
        let state = MeanderState.WAITING
        let waitUntil: game_seconds = 0
        let dir = direction.S
        const stateMachine = new splitTime.npc.BehaviorStateMachine(() => state)
        npc.body.registerTimeAdvanceListener(delta => {
            const time = splitTime.time.getFromBody(npc.body)
            if (time >= waitUntil) {
                if (state === MeanderState.WAITING) {
                    walk()
                } else {
                    wait()
                }
            }
        })
        function wait() {
            state = MeanderState.WAITING
            waitUntil = splitTime.time.getFromBody(npc.body) + splitTime.randomRanged(1, 2)
        }
        function walk() {
            state = MeanderState.WALKING
            dir = direction.getRandom()
            // 33% chance of just going back to home location
            // TODO: Increase chance as further away
            if (Math.random() < 0.33) {
                dir = direction.fromToThing(npc.body, home)
            }
            waitUntil = splitTime.time.getFromBody(npc.body) + splitTime.randomRanged(1, 3)
        }
        stateMachine.set(MeanderState.WAITING, {
            notifyTimeAdvance() {
                npc.movementAgent.setStopped()
            }
        })
        stateMachine.set(MeanderState.WALKING, {
            notifyTimeAdvance() {
                npc.movementAgent.setWalkingDirection(dir)
            },
            notifySuspension: wait
        })
        return stateMachine
    }
}