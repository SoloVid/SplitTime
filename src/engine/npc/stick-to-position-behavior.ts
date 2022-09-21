import { Behavior } from "./behavior";
import { ConditionalBehavior } from "./conditional-behavior";
import { DirectedWalkBehavior } from "./directed-walk-behavior";
import { Npc, Position, Indirect, game_seconds } from "../splitTime";
export class StickToPositionBehavior implements Behavior, ConditionalBehavior {
    private readonly helperBehavior: DirectedWalkBehavior;
    constructor(private readonly npc: Npc, private readonly position: Position, private readonly speed: Indirect<number>, private readonly moveStance: string) {
        this.helperBehavior = new DirectedWalkBehavior(npc, position, speed, moveStance);
    }
    isConditionMet(): boolean {
        return !this.helperBehavior.isCloseEnough();
    }
    notifyTimeAdvance(delta: game_seconds): void {
        this.helperBehavior.notifyTimeAdvance(delta);
    }
}
