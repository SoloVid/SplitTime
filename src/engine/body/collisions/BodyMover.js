dependsOn("/body/Body.js");

/**
 * @constructor
 */
function BodyExt() {
    this.bumped = false;
    this.pushing = false;
    this.sliding = false;
    this.previousGroundBody = null;
    this.previousGroundTraceX = -1;
    this.previousGroundTraceY = -1;
    this.previousGroundTraceZ = -1;
}

/**
 * @param {SplitTime.Body} body
 * @constructor
 */
SplitTime.Body.Mover = function(body) {
    this.body = body;
    this.bodyExt = new BodyExt();
};

SplitTime.Body.Mover.VERTICAL_FUDGE = 4;

/**
 * Zelda step with input direction
 * @param distance
 * @param direction
 * @returns {boolean}
 */
SplitTime.Body.Mover.prototype.zeldaBump = function(distance, direction) {
    this.ensureInRegion();
    //Prevent infinite recursion
    if(this.bodyExt.pushing || (this.bodyExt.bumped && !this.bodyExt.sliding)) {
        return false;
    }
    this.bodyExt.bumped = true;

    //Save direction
    var tDir = this.dir;
    //Set direction
    this.dir = direction;
    //Bump
    var moved = this.zeldaStep(direction, distance);
    //Revert direction;
    this.dir = tDir;

    this.bodyExt.bumped = false;
    return moved > 0;
};

/**
 * Check that body is in current region
 */
SplitTime.Body.Mover.prototype.ensureInRegion = function() {
    if(this.body.getLevel().getRegion() !== SplitTime.Region.getCurrent()) {
        throw new Error("Attempt to do zelda movement for body not in current region");
    }
};

/**
 * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
 * @param {number} maxDZ
 * @returns {number} Z pixels actually moved
 */
SplitTime.Body.Mover.prototype.zeldaVerticalBump = function(maxDZ) {
    this.ensureInRegion();

    var actualDZ;
    if(Math.abs(maxDZ) < 0.000001) {
        // do nothing
        return 0;
    } else if(maxDZ > 0) {
        actualDZ = this.zeldaVerticalRise(maxDZ);
        return actualDZ;
    } else if(this.body.z > 0) {
        actualDZ = this.zeldaVerticalDrop(-maxDZ);
        return actualDZ;
    }

    return 0;
};
