import { Behavior } from "./behavior";
import { TemporaryBehavior } from "./temporary-behavior";
import { areWithin90Degrees, fromToThing } from "../math/direction";
import { Indirect } from "engine/redirect";
import { game_seconds } from "engine/time/timeline";
import { ILevelLocation2, Coordinates3D } from "engine/world/level/level-location";
import { Npc } from "./npc";
export class DirectedWalkBehavior implements Behavior, TemporaryBehavior {
    constructor(private readonly npc: Npc, private readonly targetLocation: ILevelLocation2, private readonly speed: Indirect<number>, private readonly stance: string) { }
    isComplete(): boolean {
        if (this.isCloseEnough()) {
            return true;
        }
        if (this.npc.body.level !== this.targetLocation.level) {
            // If the level changed, we're just hoping that the next item was a transport
            // and it happened automatically via walking.
            // Otherwise...not sure what we would do here.
            return true;
        }
        return false;
    }
    notifyTimeAdvance(delta: game_seconds): void {
        const dirBefore = fromToThing(this.npc.body, this.targetLocation);
        this.npc.movementAgent.setWalkingTowardBoardLocation(this.targetLocation);
        this.npc.movementAgent.speed = this.speed;
        this.npc.movementAgent.stance = this.stance;
        this.npc.movementAgent.notifyTimeAdvance(delta);
        const dirAfter = fromToThing(this.npc.body, this.targetLocation);
        const overshot = !areWithin90Degrees(dirBefore, dirAfter);
        if (overshot || this.isCloseEnough()) {
            // FTODO: This forced putting could be problematic for collisions
            // if (this.targetLocation instanceof Position) {
            //     this.npc.spriteBody.putInPosition(this.targetLocation)
            // } else {
            this.npc.body.x = this.targetLocation.x;
            this.npc.body.y = this.targetLocation.y;
            this.npc.body.z = this.targetLocation.z;
            // }
        }
    }
    isCloseEnough(): boolean {
        return closeEnough(this.npc.body, this.targetLocation);
    }
}
function closeEnough(a: Coordinates3D, b: Coordinates3D): boolean {
    const approxDist = Math.abs(a.x - b.x) +
        Math.abs(a.y - b.y) +
        Math.abs(a.z - b.z);
    const CLOSE_ENOUGH = 1;
    return approxDist < CLOSE_ENOUGH;
}
