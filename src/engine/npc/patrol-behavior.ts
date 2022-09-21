import { Behavior } from "./behavior";
import { BehaviorLoop } from "./behavior-loop";
import { Npc, Position, game_seconds, Indirect, assert, int } from "../splitTime";
import { DirectedWalkBehavior } from "./directed-walk-behavior";
import { WaitBehavior } from "./wait-behavior";
import { BehaviorSequence } from "./behavior-sequence";
import { distanceEasy } from "../math/measurement";
export class PatrolBehavior implements Behavior {
    private underlyingBehavior: BehaviorLoop | null = null;
    constructor(private readonly npc: Npc, private readonly positions: readonly Position[], private readonly waitAtEach: game_seconds, private readonly speed: Indirect<number>, private readonly walkStance: string) {
        assert(positions.length >= 2, "Patrol must have at least two positions");
    }
    notifyTimeAdvance(delta: game_seconds): void {
        if (this.underlyingBehavior === null) {
            const flightPath = this.determineFlightPath();
            this.underlyingBehavior = new BehaviorLoop(() => {
                const behaviors = [];
                for (const pos of flightPath) {
                    behaviors.push(new DirectedWalkBehavior(this.npc, pos, this.speed, this.walkStance));
                    behaviors.push(new WaitBehavior(this.waitAtEach));
                }
                return new BehaviorSequence(behaviors);
            });
        }
        this.underlyingBehavior.notifyTimeAdvance(delta);
    }
    notifySuspension(): void {
        if (this.underlyingBehavior !== null) {
            this.underlyingBehavior.notifySuspension?.();
        }
        this.underlyingBehavior = null;
    }
    private determineFlightPath(): Position[] {
        const startIndex = this.calculateClosestPosition();
        return this.positions.map((_p, i, a) => a[(i + startIndex) % a.length]);
    }
    private calculateClosestPosition(): int {
        let closestPositionIndex = -1;
        let bestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < this.positions.length; i++) {
            const pos = this.positions[i];
            // FTODO: Account for 3D?
            const dist = distanceEasy(this.npc.body.x, this.npc.body.y, pos.x, pos.y);
            if (dist < bestDist) {
                closestPositionIndex = i;
                bestDist = dist;
            }
        }
        return closestPositionIndex;
    }
}
