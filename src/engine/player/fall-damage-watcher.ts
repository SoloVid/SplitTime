import { TimeNotified, game_seconds } from "../splitTime";
import { MeteredStat } from "./metered-stat";
import * as splitTime from "../splitTime";
export class FallDamageWatcher implements TimeNotified {
    private prevZVelocity: number;
    constructor(private readonly body: splitTime.Body, private readonly stamina: MeteredStat, private readonly minZVelocityForDamage: number = 640) {
        this.prevZVelocity = this.body.zVelocity;
    }
    notifyTimeAdvance(delta: game_seconds): void {
        if (this.prevZVelocity < 0) {
            const dZVelocity = this.body.zVelocity - this.prevZVelocity;
            const staminaHit = Math.pow((dZVelocity - this.minZVelocityForDamage), 1.5) / this.minZVelocityForDamage;
            if (staminaHit > 0) {
                this.stamina.hit(staminaHit);
            }
        }
        this.prevZVelocity = this.body.zVelocity;
    }
}
