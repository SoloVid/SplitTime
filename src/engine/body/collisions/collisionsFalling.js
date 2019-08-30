dependsOn("BodyMover.js");

/**
 * @param {number} maxDZ (positive)
 * @returns {number} Z pixels moved (non-positive)
 */
SplitTime.Body.Mover.prototype.zeldaVerticalDrop = function(maxDZ) {
    var collisionInfo = this.calculateDrop(maxDZ);

    this.body.setZ(collisionInfo.zBlocked);
    this.bodyExt.previousGroundBody = collisionInfo.body;
    this.bodyExt.previousGroundTraceX = collisionInfo.x;
    this.bodyExt.previousGroundTraceY = collisionInfo.y;
    this.bodyExt.previousGroundTraceZ = collisionInfo.zBlocked;
    if(collisionInfo.x >= 0) {
        this.level.runEvents(collisionInfo.events, this.body);
    }
    return -collisionInfo.distanceAllowed;
};

/**
 * @param {number} maxDZ (positive)
 * @returns {{x: int, y: int, body: SplitTime.Body|null, distanceAllowed: number, zBlocked: number, events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateDrop = function(maxDZ) {
    var roundX = Math.floor(this.body.getX());
    var roundY = Math.floor(this.body.getY());
    var z = this.body.getZ();
    var targetZ = z - maxDZ;
    var collisionInfo = {
        x: -1,
        y: -1,
        body: null,
        distanceAllowed: maxDZ,
        zBlocked: targetZ,
        events: []
    };

    var groundBody = this.bodyExt.previousGroundBody;
    if(groundBody && this.isStandingOnBody()) {
        collisionInfo.body = groundBody;
        return collisionInfo;
    }
    if(this.body.z <= 0 || this.isPreviousGroundTraceRelevant()) {
        collisionInfo.x = this.bodyExt.previousGroundTraceX;
        collisionInfo.y = this.bodyExt.previousGroundTraceY;
        collisionInfo.zBlocked = this.bodyExt.previousGroundTraceZ;
        return collisionInfo;
    }

    var collisionInfoBodies = this.calculateDropThroughBodies(
        roundX,
        roundY,
        z,
        maxDZ
    );

    var collisionInfoTraces = this.calculateDropThroughTraces(
        roundX,
        roundY,
        z,
        collisionInfoBodies.distanceAllowed
    );

    if(collisionInfoTraces.distanceAllowed < collisionInfoBodies.distanceAllowed) {
        collisionInfo.x = collisionInfoTraces.x;
        collisionInfo.y = collisionInfoTraces.y;
        collisionInfo.distanceAllowed = collisionInfoTraces.distanceAllowed;
        collisionInfo.zBlocked = collisionInfoTraces.zBlocked;
        collisionInfo.events = collisionInfoTraces.events;
    } else {
        collisionInfo.body = collisionInfoBodies.body;
        collisionInfo.distanceAllowed = collisionInfoBodies.distanceAllowed;
        collisionInfo.zBlocked = collisionInfoBodies.zBlocked;
    }

    return collisionInfo;
};

/**
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{x: int, y: int, distanceAllowed: number, zBlocked: number, events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateDropThroughTraces = function(x, y, z, maxDZ) {
    var targetZ = z - maxDZ;
    var collisionInfo = {
        x: -1,
        y: -1,
        // positive number
        distanceAllowed: maxDZ,
        zBlocked: targetZ,
        events: []
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
    //Loop through Y width of base
    for(var testY = startY; testY < startY + yPixels; testY++) {
        //Loop through X width of base
        for(var testX = startX; testX < startX + xPixels; testX++) {
            levelTraces.calculatePixelColumnCollisionInfo(originCollisionInfo, testX, testY, targetZ, z + 1);
            
            //If we have entered a new level by falling into it
            if(Object.keys(originCollisionInfo.pointerTraces).length > 0) {
                //TODO: make sure that the pointer trace gets handled properly
            }
            
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

    for(var funcId in originCollisionInfo.events) {
        var zRange = originCollisionInfo.events[funcId];
        if(zRange.exMaxZ > originCollisionInfo.zBlockedTopEx) {
            collisionInfo.events.push(funcId);
        }
    }

    // Make sure we don't go up
    if(collisionInfo.distanceAllowed < 0) {
        collisionInfo.distanceAllowed = 0;
    }
    if(collisionInfo.zBlocked > z){
        collisionInfo.zBlocked = z;
    }

    return collisionInfo;
};

/**
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{body: SplitTime.Body|null, distanceAllowed: number, zBlocked: number}}
 */
SplitTime.Body.Mover.prototype.calculateDropThroughBodies = function(x, y, z, maxDZ) {
    var targetZ = z - maxDZ;
    var collisionInfo = {
        body: null,
        // positive number
        distanceAllowed: maxDZ,
        zBlocked: targetZ
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

    function handleFoundBody(otherBody) {
        var zBlocked = otherBody.getZ() + otherBody.height;
        if(zBlocked > collisionInfo.zBlocked && zBlocked - otherBody.height / 2 <= z) {
            collisionInfo.body = otherBody;
            collisionInfo.distanceAllowed = z - zBlocked;
            collisionInfo.zBlocked = zBlocked;
        }
    }
    this.level.getCellGrid().forEachBody(startX, startY, targetZ, startX + xPixels, startY + yPixels, z, handleFoundBody);

    return collisionInfo;
};

SplitTime.Body.Mover.prototype.isStandingOnBody = function() {
    return false;
    // TODO
    // Check for perfect groundBody.z + groundBody.height === standingBody.z
    // Then check for horizontal overlap of bases
};

SplitTime.Body.Mover.prototype.isPreviousGroundTraceRelevant = function() {
    if(this.bodyExt.previousGroundTraceX >= 0) {
        var roundX = Math.floor(this.body.getX());
        var roundY = Math.floor(this.body.getY());
        var startX = roundX - this.halfBaseLength;
        var xPixels = this.baseLength;
        var startY = roundY - this.halfBaseLength;
        var yPixels = this.baseLength;
        return this.body.z === this.bodyExt.previousGroundTraceZ &&
            startX <= this.bodyExt.previousGroundTraceX &&
            this.bodyExt.previousGroundTraceX < startX + xPixels &&
            startY <= this.bodyExt.previousGroundTraceY &&
            this.bodyExt.previousGroundTraceY < startY + yPixels;
    }
    return false;
};
