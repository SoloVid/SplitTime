import { int, direction_t, pixels_t } from "../../../splitTime";
import { Horizontal } from "./collisions-horizontal";
import { Vertical } from "./collisions-vertical";
import { Transporter } from "./body-transporter";
import * as splitTime from "../../../splitTime";
class BodyExt {
    bumped: boolean = false;
    pushing: boolean = false;
    sliding: boolean = false;
    previousGroundBody: splitTime.Body | null = null;
    previousGroundTraceX: int = -1;
    previousGroundTraceY: int = -1;
    previousGroundTraceZ: int = -1;
}
export class Mover {
    body: splitTime.Body;
    bodyExt: BodyExt;
    dir: direction_t | null = null;
    horizontal: Horizontal;
    vertical: Vertical;
    constructor(body: splitTime.Body) {
        this.body = body;
        this.bodyExt = new BodyExt();
        this.horizontal = new Horizontal(this);
        this.vertical = new Vertical(this);
    }
    // This value should be at least 1 for stairs to work,
    // but even higher if stairs are ever to be steeper than 45 degrees.
    static VERTICAL_FUDGE = 4;
    /**
     * Zelda step with input direction
     */
    zeldaBump(distance: pixels_t, direction: direction_t): boolean {
        this.ensureInRegion();
        //Prevent infinite recursion
        if (this.bodyExt.pushing ||
            (this.bodyExt.bumped && !this.bodyExt.sliding)) {
            return false;
        }
        this.bodyExt.bumped = true;
        //Save direction
        var tDir = this.dir;
        //Set direction
        this.dir = direction;
        //Bump
        var moved = this.horizontal.zeldaStep(direction, distance);
        //Revert direction;
        this.dir = tDir;
        this.bodyExt.bumped = false;
        return moved > 0;
    }
    /**
     * Check that body is in current region
     */
    ensureInRegion() {
        if (!this.body.level.isLoaded()) {
            throw new Error("Attempt to do zelda movement for body not in current region");
        }
    }
    /**
     * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
     * @param {number} maxDZ
     * @returns {number} Z pixels actually moved
     */
    zeldaVerticalBump(maxDZ: number): number {
        this.ensureInRegion();
        if (Math.abs(maxDZ) < 0.000001) {
            // do nothing
            return 0;
        }
        if (maxDZ < 0 && this.body.z <= this.body.level.lowestLayerZ) {
            // do nothing
            return 0;
        }
        return this.vertical.zeldaVerticalMove(maxDZ);
    }
    transportLevelIfApplicable() {
        var transporter = new Transporter(this.body);
        transporter.transportLevelIfApplicable();
    }
}
