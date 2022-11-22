import { IAbility } from "./ability";
import { Body } from "engine/world/body/body";
import { Indirect, redirect } from "engine/redirect";

export class Jump implements IAbility {
    constructor(private readonly body: Body, private readonly approxMaxHeight: Indirect<number>) { }
    private zVelocityFromMaxHeight(approxMaxHeight: number): number {
        // Solving x = 1/2 * a * t^2 + v0 * t + x0
        const timeToReachMax = Math.sqrt(approxMaxHeight / (0.5 * Math.abs(this.body.GRAVITY)));
        return Math.abs(this.body.GRAVITY) * timeToReachMax;
    }
    private get zVelocity(): number {
        return this.zVelocityFromMaxHeight(redirect(this.approxMaxHeight));
    }
    use(): boolean {
        var fallCollisionInfo = this.body.mover.vertical.calculateZCollision(this.body.level, this.body.x, this.body.y, this.body.z, -1);
        if (fallCollisionInfo.dzAllowed === 0) {
            this.body.zVelocity = this.zVelocity;
            return true;
        }
        return false;
    }
}
