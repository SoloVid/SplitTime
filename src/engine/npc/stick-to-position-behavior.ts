import { Indirect } from "engine/redirect";
import { game_seconds } from "engine/time/timeline";
import { Position } from "engine/world/level/position";
import { Behavior } from "./behavior";
import { ConditionalBehavior } from "./conditional-behavior";
import { DirectedWalkBehavior } from "./directed-walk-behavior";
import { Npc } from "./npc";
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
