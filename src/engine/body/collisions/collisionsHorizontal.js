dependsOn("BodyMover.js");

var ZILCH = 0.000001;

/**
 * Advances SplitTime.Body up to maxDistance pixels as far as is legal.
 * Includes pushing other Bodys out of the way? (this part is currently unavailable)
 * @param {number} dir
 * @param {number} maxDistance
 * @returns {number} distance actually moved
 */
SplitTime.Body.Mover.prototype.zeldaStep = function(dir, maxDistance) {
    this.ensureInLevel();
    var level = this.level;

    var dy = -maxDistance * Math.sin(dir * (Math.PI / 2)); //Total y distance to travel
    if(Math.abs(dy) < ZILCH) {
        dy = 0;
    }
    var dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy);
    var ady = Math.abs(dyRounded);

    var dx = maxDistance * Math.cos(dir * (Math.PI / 2)); //Total x distance to travel
    if(Math.abs(dx) < ZILCH) {
        dx = 0;
    }
    var dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx);
    var adx = Math.abs(dxRounded);

    var jHat = dy === 0 ? 0 : dyRounded / ady;
    var iHat = dx === 0 ? 0 : dxRounded / adx;

    var maxIterations = adx + ady;
    var xPixelsRemaining = adx;
    var yPixelsRemaining = ady;

    var outY = false;
    var stoppedY = false;
    var pixelsMovedY = 0;

    var outX = false;
    var stoppedX = false;
    var pixelsMovedX = 0;

    var oldX = this.body.getX();
    var oldY = this.body.getY();
    var oldRoundX = Math.floor(oldX);
    var oldRoundY = Math.floor(oldY);
    var roundX = oldRoundX;
    var roundY = oldRoundY;
    var currentZ = this.body.getZ();

    var functionIdSet = {};
    for(var i = 0; i < maxIterations; i++) {
        if(xPixelsRemaining > 0) {
            var newRoundX = roundX + iHat;
            if(newRoundX >= level.width || newRoundX < 0) {
                outX = true;
            } else {
                var xCollisionInfo = this.calculateXPixelCollisionWithStepUp(roundX, roundY, currentZ, iHat);
                if(xCollisionInfo.blocked) {
                    stoppedX = true;
                    if(xCollisionInfo.bodies.length > 0) {
                        // Slow down when pushing
                        xPixelsRemaining--;
                        this.tryPushOtherBodies(xCollisionInfo.bodies, dx > 0 ? SplitTime.Direction.E : SplitTime.Direction.W);
                    }
                } else {
                    roundX = newRoundX;
                    currentZ = xCollisionInfo.adjustedZ;
                    xPixelsRemaining--;
                    pixelsMovedX++;
                    addArrayToSet(xCollisionInfo.functions, functionIdSet);
                }
            }
        }

        if(yPixelsRemaining > 0) {
            var newRoundY = roundY + jHat;
            //Check if out of bounds
            if(newRoundY >= level.yWidth || newRoundY < 0) {
                outY = true;
            } else {

                var yCollisionInfo = this.calculateYPixelCollisionWithStepUp(roundX, roundY, currentZ, jHat);
                if(yCollisionInfo.blocked) {
                    stoppedY = true;
                    if(yCollisionInfo.bodies.length > 0) {
                        // Slow down when pushing
                        yPixelsRemaining--;
                        this.tryPushOtherBodies(yCollisionInfo.bodies, dy > 0 ? SplitTime.Direction.S : SplitTime.Direction.N);
                    }
                } else {
                    roundY = newRoundY;
                    currentZ = yCollisionInfo.adjustedZ;
                    yPixelsRemaining--;
                    pixelsMovedY++;
                    addArrayToSet(yCollisionInfo.functions, functionIdSet);
                }
            }
        }
    }

    if(ady > 0 && pixelsMovedY > 0) {
        var roundYMoved = roundY - oldRoundY;
        var newYFromSteps = oldY + roundYMoved;
        // Subtract off any overshoot
        var actualNewY = newYFromSteps - (dyRounded - dy);
        this.body.setY(actualNewY);
    }
    if(adx > 0 && pixelsMovedX > 0) {
        var roundXMoved = roundX - oldRoundX;
        var newXFromSteps = oldX + roundXMoved;
        // Subtract off any overshoot
        var actualNewX = newXFromSteps - (dxRounded - dx);
        this.body.setX(actualNewX);
    }
    this.body.setZ(currentZ);

    //If stopped, help person out by sliding around corner
    var stopped = stoppedX || stoppedY;
    var out = outX || outY;
    if(stopped && !out && pixelsMovedX + pixelsMovedY < maxDistance / 2) {
        this.zeldaSlide(maxDistance / 2);
    }

    this.level.runFunctionSet(functionIdSet, this.body);

    return SplitTime.Measurement.distanceTrue(oldX, oldY, this.body.getX(), this.body.getY());
};

function addArrayToSet(arr, set) {
    for(var i = 0; i < arr.length; i++) {
        set[arr[i]] = true;
    }
}

SplitTime.Body.Mover.prototype.tryPushOtherBodies = function(bodies, dir) {
    this.bodyExt.pushing = true;
    for(var i = 0; i < bodies.length; i++) {
        var mover = new SplitTime.Body.Mover(bodies[i]);
        mover.zeldaBump(1, dir);
    }
    this.bodyExt.pushing = false;
};

function isZOverlap(z1, height1, z2, height2) {
    var noOverlap = z1 + height1 <= z2 || z2 + height2 <= z1;
    return !noOverlap;
}

/**
 * Check that the area is open in level collision canvas data.
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {number} z
 * @returns {{blocked: boolean, vStepUpEstimate: number, functions: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateAreaTraceCollision = function(startX, xPixels, startY, yPixels, z) {
    var collisionInfo = {
        blocked: false,
        vStepUpEstimate: 0,
        functions: []
    };

    var originCollisionInfo = new SplitTime.LevelTraces.CollisionInfo();
    this.level.getLevelTraces().calculateVolumeCollision(originCollisionInfo, startX, xPixels, startY, yPixels, z, z + this.height);

    collisionInfo.vStepUpEstimate = originCollisionInfo.zBlockedTopEx - z;
    collisionInfo.blocked = originCollisionInfo.containsSolid && collisionInfo.vStepUpEstimate > 0;
    for(var funcId in originCollisionInfo.functions) {
        collisionInfo.functions.push(funcId);
    }

    return collisionInfo;
};
