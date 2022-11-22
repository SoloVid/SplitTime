import { Mover } from "./body-mover";
import { getXSign, getYSign } from "../../../math/direction";
import { COLLISION_CALCULATOR } from "./collision-calculator";

export class Sliding {
    mover: Mover;
    constructor(mover: Mover) {
        this.mover = mover;
    }
    zeldaSlide(maxDistance: number) {
        if (this.mover.bodyExt.sliding) {
            return;
        }
        this.mover.bodyExt.sliding = true;
        var x = Math.floor(this.mover.body.getX());
        var y = Math.floor(this.mover.body.getY());
        var dist = maxDistance; //Math.min(1, maxDistance);
        // Closest diagonal direction positive angle from current direction
        var positiveDiagonal = (Math.round(this.mover.body.dir + 1.1) - 0.5) % 4;
        // Closest diagonal direction negative angle from current direction
        var negativeDiagonal = (Math.round(this.mover.body.dir + 3.9) - 0.5) % 4;
        const me = this;
        const level = this.mover.body.getLevel();
        function isCornerOpen(direction: number, howFarAway: number) {
            const testX = x +
                getXSign(direction) *
                    (me.mover.body.width / 2 + howFarAway);
            const testY = y +
                getYSign(direction) *
                    (me.mover.body.depth / 2 + howFarAway);
            const collisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(me.mover.body.collisionMask, level, testX, 1, testY, 1, me.mover.body.z, me.mover.body.height);
            return !collisionInfo.blocked;
        }
        for (let howFarOut = 1; howFarOut <= 5; howFarOut++) {
            const isCorner1Open = isCornerOpen(positiveDiagonal, howFarOut);
            const isCorner2Open = isCornerOpen(negativeDiagonal, howFarOut);
            if (isCorner1Open && !isCorner2Open) {
                this.mover.zeldaBump(dist, positiveDiagonal);
                break;
            }
            else if (isCorner2Open && !isCorner1Open) {
                this.mover.zeldaBump(dist, negativeDiagonal);
                break;
            }
        }
        this.mover.bodyExt.sliding = false;
    }
}
