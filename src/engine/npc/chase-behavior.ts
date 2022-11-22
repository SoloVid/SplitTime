import { Behavior } from "./behavior";
import { ConditionalBehavior } from "./conditional-behavior";
import { approach, areWithin90Degrees, fromToThing, getOpposite } from "../math/direction";
import { distanceTrue, pixels_t } from "../math/measurement";
import { canDetect } from "../world/body/detection";
import { game_seconds } from "engine/time/timeline";
import { Sprite } from "engine/world/body/render/sprite";
import { Npc } from "./npc";
import { Body } from "engine/world/body/body";
export class ChaseBehavior implements Behavior, ConditionalBehavior {
    private timeWithoutSeeing: game_seconds = Number.POSITIVE_INFINITY;
    BLIND_TIME: game_seconds = 2;
    TERMINATION_TIME: game_seconds = 5;
    sightDistance: pixels_t = 256;
    senseDistance: pixels_t;
    moveStance: string = "run";
    chaseSpeed: pixels_t = 32;
    private distanceToKeep = 32;
    private chasingRadiansOff = 0;
    private temporaryDirectionBlacklist = {};
    constructor(private readonly npc: Npc, private readonly bodyToChaseGetter: () => Body, private readonly howCloseToGet: number) {
        this.senseDistance = 2 * this.npc.body.width;
    }
    private inLevel(): boolean {
        return this.npc.body.getLevel() === this.bodyToChaseGetter().getLevel();
    }
    isConditionMet(): boolean {
        if (!this.inLevel()) {
            return false;
        }
        if (this.timeWithoutSeeing < this.TERMINATION_TIME) {
            return true;
        }
        return this.canDetect();
    }
    notifyTimeAdvance(delta: game_seconds): void {
        if (!this.inLevel()) {
            return;
        }
        const pb = this.bodyToChaseGetter();
        const b = this.npc.body;
        if (this.canDetect()) {
            this.timeWithoutSeeing = 0;
        }
        else {
            this.timeWithoutSeeing += delta;
        }
        if (this.timeWithoutSeeing < this.BLIND_TIME) {
            // const targetRadiansOff = 2 * Math.PI * Math.random() - Math.PI
            // this.chasingRadiansOff = approachValue(this.chasingRadiansOff, targetRadiansOff, 0.1)
            // // const targetLoc = pb
            // const targetLoc = new InFrontOfBody(pb, this.distanceToKeep, this.chasingRadiansOff)
            // const closeEnough = 2
            // if (splitTime.measurement.distanceEasy(b.x, b.y, targetLoc.x, targetLoc.y) <= closeEnough) {
            //     return
            // }
            // const targetDir = splitTime.direction.fromToThing(b, targetLoc)
            const targetDir = fromToThing(b, pb);
            const TURN_SPEED = 4;
            b.dir = approach(b.dir, targetDir, delta * TURN_SPEED);
            if (areWithin90Degrees(targetDir, b.dir, 0.5)) {
                this.npc.sprite.requestStance(this.moveStance, b.dir);
                // FTODO: account for 2D (not just x width)
                const distanceFromChased = distanceTrue(b.x, b.y, pb.x, pb.y) - pb.width / 2;
                const distanceFromTarget = Math.abs(distanceFromChased - this.howCloseToGet);
                const moveDist = Math.min(delta * this.chaseSpeed, distanceFromTarget);
                if (distanceFromChased < this.howCloseToGet) {
                    b.mover.zeldaBump(moveDist, getOpposite(b.dir));
                }
                else {
                    b.mover.zeldaBump(moveDist, b.dir);
                }
            }
            else {
                // FTODO: explicit stance?
                this.npc.sprite.requestStance(Sprite.DEFAULT_STANCE, b.dir, true);
            }
        }
        else {
            // Do nothing (wait)
            // FTODO: Maybe look around?
        }
    }
    private canDetect(): boolean {
        return canDetect(this.npc.body, this.bodyToChaseGetter(), this.sightDistance);
    }
}
