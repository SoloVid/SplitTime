dependsOn("BodyMover.js");

var ZILCH = 0.00001;

/**
 * @param {number} maxDZ (positive)
 * @returns {number} Z pixels moved (non-negative)
 */
SplitTime.Body.Mover.prototype.zeldaVerticalRise = function(maxDZ) {
    var collisionInfo = this.calculateRise(maxDZ);
    var levelIdSet = {};

    this.body.setZ(collisionInfo.zEnd);
    if(collisionInfo.x >= 0) {
        this.body.getLevel().runEvents(collisionInfo.events, this.body);
    }
    if(collisionInfo.body && collisionInfo.distanceAllowed < maxDZ) {
        var howMuchUnmoved = maxDZ - collisionInfo.distanceAllowed;
        var howFarToPushOther = Math.min(howMuchUnmoved, 1);
        collisionInfo.body.mover.zeldaVerticalRise(howFarToPushOther);
        var howMuchMoreICanMove = howMuchUnmoved - howFarToPushOther * 2;
        if(howMuchMoreICanMove > 0) {
            return this.zeldaVerticalRise(howMuchMoreICanMove);
        }
    }
    if(collisionInfo.distanceAllowed > ZILCH && this.body.zVelocity < 0) {
        this.body.zVelocity = 0;
    }
    
    //If we have entered a new level by falling into it
    if(collisionInfo.otherLevels.length > 0){
        addArrayToSet(collisionInfo.otherLevels, levelIdSet);
        this.transportLevelIfApplicable(levelIdSet);
    }
    
    return collisionInfo.distanceAllowed;
};

function addArrayToSet(arr, set) {
    for(var i = 0; i < arr.length; i++) {
        set[arr[i]] = true;
    }
}

/**
 * @param {number} maxDZ (positive)
 * @returns {{x: int, y: int, body: SplitTime.Body|null, distanceAllowed: number, zBlocked: number, zEnd: number, events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateRise = function(maxDZ) {
    var roundX = Math.floor(this.body.getX());
    var roundY = Math.floor(this.body.getY());
    var z = this.body.getZ();
    var top = z + this.height;
    var targetZ = z + maxDZ;
    var targetTop = top + maxDZ;
    var collisionInfo = {
        x: -1,
        y: -1,
        body: null,
        distanceAllowed: maxDZ,
        zBlocked: targetTop,
        zEnd: targetZ,
        events: [],
        otherLevels: []
    };

    var collisionInfoBodies = this.calculateRiseThroughBodies(
        roundX,
        roundY,
        z,
        maxDZ
    );

    var collisionInfoTraces = this.calculateRiseThroughTraces(
        roundX,
        roundY,
        z,
        collisionInfoBodies.distanceAllowed
    );
    
    //TODO: should this line be inside the if/else block below?
    collisionInfo.otherLevels = collisionInfoTraces.otherLevels;
    
    if(collisionInfoTraces.distanceAllowed < collisionInfoBodies.distanceAllowed) {
        collisionInfo.x = collisionInfoTraces.x;
        collisionInfo.y = collisionInfoTraces.y;
        collisionInfo.distanceAllowed = collisionInfoTraces.distanceAllowed;
        collisionInfo.zBlocked = collisionInfoTraces.zBlocked;
        collisionInfo.zEnd = collisionInfoTraces.zEnd;
        collisionInfo.events = collisionInfoTraces.events;
    } else {
        collisionInfo.body = collisionInfoBodies.body;
        collisionInfo.distanceAllowed = collisionInfoBodies.distanceAllowed;
        collisionInfo.zBlocked = collisionInfoBodies.zBlocked;
        collisionInfo.zEnd = collisionInfoBodies.zEnd;
    }

    return collisionInfo;
};

/**
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{x: int, y: int, distanceAllowed: number, zBlocked: number, zEnd: number, events: string[]}}
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
        events: [],
        otherLevels: []
    };

    var startX = x - this.halfBaseLength;
    var xPixels = this.baseLength;
    var startY = y - this.halfBaseLength;
    var yPixels = this.baseLength;

    var levelTraces = this.body.getLevel().getLevelTraces();
    var originCollisionInfo = new SplitTime.LevelTraces.CollisionInfo();
    //Loop through width of base
    for(var testY = startY; testY < startY + yPixels; testY++) {
        //Loop through height of base
        for(var testX = startX; testX < startX + xPixels; testX++) {
            levelTraces.calculatePixelColumnCollisionInfo(originCollisionInfo, testX, testY, top, targetTop);
            
            //If we have entered a new level by falling into it
            if(Object.keys(originCollisionInfo.pointerTraces).length > 0) {
                //Make sure that the pointer trace will get handled properly
                var count = 0;
                for(var levelId in originCollisionInfo.pointerTraces) {
                    collisionInfo.otherLevels[count] = levelId;
                    count++;
                }
            }
            
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

/**
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{body: SplitTime.Body|null, distanceAllowed: number, zBlocked: number, zEnd: number}}
 */
SplitTime.Body.Mover.prototype.calculateRiseThroughBodies = function(x, y, z, maxDZ) {
    var top = z + this.height;
    var targetZ = z + maxDZ;
    var targetTop = top + maxDZ;
    var collisionInfo = {
        body: null,
        distanceAllowed: maxDZ,
        zBlocked: targetTop,
        zEnd: targetZ
    };

    var startX = x - this.halfBaseLength;
    var xPixels = this.baseLength;
    var startY = y - this.halfBaseLength;
    var yPixels = this.baseLength;

    function handleFoundBody(otherBody) {
        var zBlocked = otherBody.getZ();
        if(zBlocked < collisionInfo.zBlocked && zBlocked + otherBody.height / 2 >= top) {
            collisionInfo.body = otherBody;
            collisionInfo.distanceAllowed = zBlocked - top;
            collisionInfo.zBlocked = zBlocked;
        }
    }
    this.body.getLevel().getCellGrid().forEachBody(startX, startY, top, startX + xPixels, startY + yPixels, targetTop, handleFoundBody);

    collisionInfo.zEnd = collisionInfo.zBlocked - this.height;

    return collisionInfo;
};
