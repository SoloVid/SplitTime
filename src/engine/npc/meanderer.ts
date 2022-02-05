import { Npc, ILevelLocation2, game_seconds, randomRanged } from "../splitTime";
import { Behavior } from "./behavior";
import { S, getRandom } from "../math/direction";
import { BehaviorStateMachine } from "./behavior-state-machine";
import { getFromBody } from "../time/time-helper";
import { fromToThing } from "../splitTime.direction";
enum MeanderState {
    WAITING = "WAITING",
    WALKING = "WALKING"
}
export function makeMeanderingBehavior(npc: Npc, home: ILevelLocation2): Behavior {
    let state = MeanderState.WAITING;
    let waitUntil: game_seconds = 0;
    let dir = S;
    const stateMachine = new BehaviorStateMachine(() => state);
    npc.body.registerTimeAdvanceListener(delta => {
        const time = getFromBody(npc.body);
        if (time >= waitUntil) {
            if (state === MeanderState.WAITING) {
                walk();
            }
            else {
                wait();
            }
        }
    });
    function wait() {
        state = MeanderState.WAITING;
        waitUntil = getFromBody(npc.body) + randomRanged(1, 2);
    }
    function walk() {
        state = MeanderState.WALKING;
        dir = getRandom();
        // 33% chance of just going back to home location
        // TODO: Increase chance as further away
        if (Math.random() < 0.33) {
            dir = fromToThing(npc.body, home);
        }
        waitUntil = getFromBody(npc.body) + randomRanged(1, 3);
    }
    stateMachine.set(MeanderState.WAITING, {
        notifyTimeAdvance() {
            npc.movementAgent.setStopped();
        }
    });
    stateMachine.set(MeanderState.WALKING, {
        notifyTimeAdvance() {
            npc.movementAgent.setWalkingDirection(dir);
        },
        notifySuspension: wait
    });
    return stateMachine;
}
