dependsOn("BodyMover.js");

/**
 * @param {number} maxDZ (positive)
 * @returns {number} Z pixels moved (non-positive)
 */
SplitTime.Body.Mover.prototype.zeldaVerticalDropTraces = function(maxDZ) {
    var roundX = Math.floor(this.body.getX());
    var roundY = Math.floor(this.body.getY());

    var collisionInfo = this.calculateDropThroughTraces(
        roundX,
        roundY,
        this.body.getZ(),
        maxDZ
    );

    this.body.setZ(collisionInfo.zBlocked);
    if(collisionInfo.x >= 0) {
        this.bodyExt.previousGroundTraceX = collisionInfo.x;
        this.bodyExt.previousGroundTraceY = collisionInfo.y;
        this.bodyExt.previousGroundTraceZ = collisionInfo.zBlocked;
    }
    this.level.runFunctions(collisionInfo.functions, this.body);
    return -collisionInfo.distanceAllowed;
};

/**
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{x: number, y: number, distanceAllowed: number, zBlocked: number, functions: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateDropThroughTraces = function(x, y, z, maxDZ) {
    var targetZ = z - maxDZ;
    var collisionInfo = {
        x: -1,
        y: -1,
        // positive number
        distanceAllowed: maxDZ,
        zBlocked: targetZ,
        functions: []
    };

    var startX = x - this.halfBaseLength;
    var xPixels = this.baseLength;
    var startY = y - this.halfBaseLength;
    var yPixels = this.baseLength;

    if(z <= 0) {
        collisionInfo.distanceAllowed = 0;
        collisionInfo.zBlocked = 0;
        return collisionInfo;
    } else if(targetZ <= 0) {
        collisionInfo.distanceAllowed = z;
        collisionInfo.zBlocked = 0;
    }

    var levelTraces = this.level.getLevelTraces();
    var originCollisionInfo = new SplitTime.LevelTraces.CollisionInfo();
    //Loop through width of base
    for(var testY = startY; testY < startY + yPixels; testY++) {
        //Loop through height of base
        for(var testX = startX; testX < startX + xPixels; testX++) {
            levelTraces.calculatePixelColumnCollisionInfo(originCollisionInfo, testX, testY, targetZ, z);
            if(originCollisionInfo.containsSolid && originCollisionInfo.zBlockedTopEx !== collisionInfo.zBlocked) {
                if(collisionInfo.zBlocked === null || collisionInfo.zBlocked < originCollisionInfo.zBlockedTopEx) {
                    collisionInfo.x = testX;
                    collisionInfo.y = testY;
                    collisionInfo.distanceAllowed = z - originCollisionInfo.zBlockedTopEx;
                    collisionInfo.zBlocked = originCollisionInfo.zBlockedTopEx;

                    if(collisionInfo.distanceAllowed <= 0) {
                        // TODO: break loops
                        // return true;
                    }
                }
            }
        }
    }

    for(var funcId in originCollisionInfo.functions) {
        var zRange = originCollisionInfo.functions[funcId];
        if(zRange.exMaxZ > originCollisionInfo.zBlockedTopEx) {
            collisionInfo.functions.push(funcId);
        }
    }

    return collisionInfo;
};

