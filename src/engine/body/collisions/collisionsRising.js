dependsOn("BodyMover.js");

/**
 * @param {number} maxDZ (positive)
 * @returns {number} Z pixels can move (non-negative)
 */
SplitTime.Body.Mover.prototype.zeldaVerticalRiseTraces = function(maxDZ) {
    var halfBaseLength = Math.round(this.body.baseLength / 2);
    var roundX = Math.floor(this.body.getX());
    var roundY = Math.floor(this.body.getY());

    var collisionInfo = this.calculateRiseThroughTraces(roundX, roundY, this.body.getZ(), maxDZ);

    this.body.setZ(this.body.getZ() + collisionInfo.distanceAllowed);
    this.level.runFunctions(collisionInfo.events, this.body);
    return collisionInfo.distanceAllowed;
};

/**
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{x: number, y: number, distanceAllowed: number, zBlocked: number, zEnd: number, events: Array}}
 */
SplitTime.Body.Mover.prototype.calculateRiseThroughTraces = function(x, y, z, maxDZ) {
    var top = z + this.height;
    var targetZ = z + maxDZ;
    var targetTop = top + maxDZ;
    var collisionInfo = {
        x: -1,
        y: -1,
        distanceAllowed: maxDZ,
        zBlocked: targetTop,
        zEnd: targetZ,
        events: []
    };

    var startX = x - this.halfBaseLength;
    var xPixels = this.baseLength;
    var startY = y - this.halfBaseLength;
    var yPixels = this.baseLength;

    var levelTraces = this.level.getLevelTraces();
    var originCollisionInfo = new SplitTime.LevelTraces.CollisionInfo();
    //Loop through width of base
    for(var testY = startY; testY < startY + yPixels; testY++) {
        //Loop through height of base
        for(var testX = startX; testX < startX + xPixels; testX++) {
            levelTraces.calculatePixelColumnCollisionInfo(originCollisionInfo, testX, testY, top, targetTop);
            if(originCollisionInfo.containsSolid && originCollisionInfo.zBlockedTopEx !== collisionInfo.zBlocked) {
                if(collisionInfo.zBlocked === null || collisionInfo.zBlocked > originCollisionInfo.zBlockedBottom) {
                    collisionInfo.x = testX;
                    collisionInfo.y = testY;
                    collisionInfo.distanceAllowed = originCollisionInfo.zBlockedBottom - top;
                    collisionInfo.zBlocked = originCollisionInfo.zBlockedBottom;

                    if(collisionInfo.distanceAllowed <= 0) {
                        // TODO: break loops
                        // return true;
                    }
                }
            }
        }
    }

    for(var funcId in originCollisionInfo.events) {
        var zRange = originCollisionInfo.events[funcId];
        if(zRange.minZ < originCollisionInfo.zBlockedBottom) {
            collisionInfo.events.push(funcId);
        }
    }

    // Make sure we don't go down
    if(collisionInfo.distanceAllowed < 0) {
        collisionInfo.distanceAllowed = 0;
    }
    if(collisionInfo.zBlocked < top){
        collisionInfo.zBlocked = top;
    }
    collisionInfo.zEnd = collisionInfo.zBlocked - this.height;

    return collisionInfo;
};
