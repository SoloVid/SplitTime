dependsOn("/body/Body.js");

/**
 * @param {SplitTime.Body} body
 * @constructor
 */
SplitTime.Body.Warper = function(body) {
    this.body = body;
    /** @type {SplitTime.Level} */
    this.level = body.getLevel();

    this.baseLength = this.body.baseLength;
    this.halfBaseLength = Math.round(this.baseLength / 2);
    this.height = this.body.height;
};

/**
 * Check that body is in current region
 */
SplitTime.Body.Warper.prototype.ensureInRegion = function() {
    if(this.body.getLevel().getRegion() !== SplitTime.Region.getCurrent()) {
        throw new Error("Attempt to do zelda movement for body not in current region");
    }
};

/**
 * Advances SplitTime.Body up to maxDistance pixels as far as is legal.
 * Includes pushing other Bodys out of the way? (this part is currently unavailable)
 * @param {number} dir
 * @param {number} maxDistance
 * @returns {number} distance actually moved
 */
SplitTime.Body.Warper.prototype.warp = function(dir, maxDistance) {
    this.ensureInRegion();

    var startX = Math.round(this.body.x);
    var startY = Math.round(this.body.y);
    var z = Math.round(this.body.z);
    var furthestX = Math.round(this.body.x + maxDistance * SplitTime.Direction.getXMagnitude(dir));
    var furthestY = Math.round(this.body.y + maxDistance * SplitTime.Direction.getYMagnitude(dir));

    var toX = null;
    var toY = null;
    var events = [];
    var otherLevelId = null;

    var me = this;
    SLVD.Bresenham.forEachPoint(furthestX, furthestY, startX, startY, function(x, y) {
        if(x + me.halfBaseLength >= me.level.width || x - me.halfBaseLength < 0) {
            return false;
        }
        if(y + me.halfBaseLength >= me.level.yWidth || y - me.halfBaseLength < 0) {
            return false;
        }
        var collisionInfo = me._getCollisionInfoAt(x, y, z);
        if(!collisionInfo.blocked) {
            if(toX === null) {
                toX = x;
                toY = y;
                events = collisionInfo.events;
                if(collisionInfo.otherLevels.length === 1) {
                    otherLevelId = collisionInfo.otherLevels[0];
                }
            }
            return true;
        }
    });

    if(toX !== null && toY !== null && (Math.abs(toX - startX) > this.baseLength || Math.abs(toY - startY) > this.baseLength)) {
        this.body.put(this.level, toX, toY, z);
        this.level.runEvents(events, this.body);
        if(otherLevelId !== null) {
            var transporter = new SplitTime.Body.Transporter(this.body);
            transporter.transportLevelIfApplicable(otherLevelId);
        }
        return SplitTime.Measurement.distanceTrue(startX, startY, toX, toY);
    } else {
        return 0;
    }
};

/**
 * @param x
 * @param y
 * @param z
 * @return {{blocked: boolean, events: string[], otherLevels: string[]}}
 * @private
 */
SplitTime.Body.Warper.prototype._getCollisionInfoAt = function(x, y, z) {
    var left = x - this.halfBaseLength;
    var top = y - this.halfBaseLength;

    return SplitTime.COLLISION_CALCULATOR.calculateVolumeCollision(this.level, left, this.baseLength, top, this.baseLength, z, this.body.height, this.body);
};
