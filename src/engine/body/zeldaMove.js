dependsOn("Body.js");

/**
 * Zelda step with input direction
 * @param distance
 * @param direction
 * @returns {boolean}
 */
SplitTime.Body.prototype.zeldaBump = function(distance, direction) {
    ensureInLevel(this);
    //Prevent infinite recursion
    if(this._zeldaPushing || this._zeldaBumped) {
        return false;
    }
    this._zeldaBumped = true;

    //Save direction
    var tDir = this.dir;
    //Set direction
    this.dir = direction;
    //Bump
    var moved = this.zeldaStep(distance);
    //Revert direction;
    this.dir = tDir;

    this._zeldaBumped = false;
    return moved;
};

SplitTime.Body.prototype.zeldaLockOnPlayer = function() {
    var player = SplitTime.Player.getActiveBody();
    this.zeldaLockOnPoint(player.x, player.y);
};

/**
 * @param {number} qx
 * @param {number} qy
 */
SplitTime.Body.prototype.zeldaLockOnPoint = function(qx, qy) {
    this.dir = SplitTime.Direction.fromTo(this.x, this.y, qx, qy);
};

/**
 * Advances SplitTime.Body person up to distance distance as far as is legal.
 * Includes pushing other Bodys out of the way?
 * Returns -1 if stopped before distance?
 * @param {number} distance
 * @returns {boolean}
 */
SplitTime.Body.prototype.zeldaStep = function(distance) {
    ensureInLevel(this);
    var level = this.getLevel();

    var dy = -distance * Math.sin((this.dir) * (Math.PI / 2)); //Total y distance to travel
    var dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy);
    var ady = Math.abs(dyRounded);

    var dx = distance * Math.cos((this.dir) * (Math.PI / 2)); //Total x distance to travel
    var dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx);
    var adx = Math.abs(dxRounded);

    var jHat = dyRounded / ady;
    var iHat = dxRounded / adx;

    this._totalStepDistance = distance;
    // this.stepDistanceRemaining = adx + ady;
    // TODO: put some logic for nearby agents in Level
    // this.nearbyBodies = level.getBodies();
    this.nearbyBodies = level.getBodiesWithin(this, this.baseLength / 2);
    this.pushedBodies = [];
    this._pixelsCrossed = {};

    var maxIterations = adx + ady;
    var xPixelsRemaining = adx;
    var yPixelsRemaining = ady;

    var outY = false;
    var stoppedY = false;
    var pixelsMovedY = 0;

    var outX = false;
    var stoppedX = false;
    var pixelsMovedX = 0;

    for(var i = 0; i < maxIterations; i++) {
        if(xPixelsRemaining > 0) {
            this.x += iHat;
            if(this.x >= level.width || this.x < 0) {
                outX = true;
            }
            else {
                stoppedX = !zeldaCheckStep(this, "x", "y", dx > 0);
            }

            // this.stepDistanceRemaining--;

            if(stoppedX || outX) {
                this.x -= iHat;
            }
            else {
                xPixelsRemaining--;
                pixelsMovedX++;
            }
        }

        if(yPixelsRemaining > 0) {
            this.y += jHat;
            //Check if out of bounds
            if(this.y >= level.height || this.y < 0) {
                outY = true;
            }
            else {
                stoppedY = !zeldaCheckStep(this, "y", "x", dy > 0);
            }

            if(stoppedY || outY) {
                this.y -= jHat;
            }
            else {
                yPixelsRemaining--;
                pixelsMovedY++;
            }
        }
    }
    if(ady > 0 && !stoppedY && !outY) {
        // Subtract off any overshoot
        this.y -= (dyRounded - dy);
    }
    if(adx > 0 && !stoppedX && !outX) {
        // Subtract off any overshoot
        this.x -= (dxRounded - dx);
    }

    this.nearbyBodies = null;
    this.pushedBodies = null;
    // this.stepDistanceRemaining = null;

    //If stopped, help person out by sliding around corner
    var stopped = stoppedX || stoppedY;
    var out = outX || outY;
    if(stopped && !out && pixelsMovedX + pixelsMovedY < distance / 2) {
        zeldaSlide(this, distance / 2);
    }

    return !(stopped || out);
};

/**
 * Check that the last moved pixel is allowed.
 * @param {SplitTime.Body} body
 * @param {string} axis "x" or "y" primary movement direction
 * @param {string} altAxis "x" or "y" opposite of axis
 * @param {boolean} isPositive
 * @returns {boolean}
 */
function zeldaCheckStep(body, axis, altAxis, isPositive) {
    return zeldaCheckStepTraces(body, axis, altAxis, isPositive) && zeldaCheckStepBodies(body);
}

/**
 * Check that the last moved pixel is allowed in level collision canvas data.
 * @param {SplitTime.Body} body
 * @param {string} axis "x" or "y" primary movement direction
 * @param {string} altAxis "x" or "y" opposite of axis
 * @param {boolean} isPositive
 * @returns {boolean}
 */
function zeldaCheckStepTraces(body, axis, altAxis, isPositive) {
    var coords = {};
    var level = body.getLevel();

    coords[axis] = Math.round(isPositive ? (body[axis] + body.baseLength / 2) : (body[axis] - body.baseLength / 2));

    var stopped = level.withRelevantTraceDataLayers(body, function(data) {
        //Loop through width of base
        for(var i = -body.baseLength / 2; i < body.baseLength / 2; i++) {
            coords[altAxis] = Math.round(body[altAxis] + i);
            var dataIndex = SplitTime.pixCoordToIndex(coords.x, coords.y, data);
            var r = data.data[dataIndex++];
            var g = data.data[dataIndex++];
            var b = data.data[dataIndex++];
            var a = data.data[dataIndex++];
            if(r === 255) {
                return true;
            } else if(a !== 0) {
                var colorId = r + "," + g + "," + b + "," + a;
                if(body._pixelsCrossed[colorId] === undefined) {
                    try {
                        body._pixelsCrossed[colorId] = crossPixel(body, r, g, b, a) !== false;
                    } catch(ex) {
                        console.error(ex);
                    }
                }
                if(!body._pixelsCrossed[colorId]) {
                    return true;
                }
            }
        }
    });
    return !stopped;
}

/**
 *
 * @param {SplitTime.Body} me
 * @returns {boolean}
 */
function zeldaCheckStepBodies(me) {
    // var refinedNearbyBodies = [];
    //Check for collision with people
    for(var i = 0; i < me.nearbyBodies.length; i++) {
        var body = me.nearbyBodies[i];
        if(me.team != body.team && body.baseLength > 0) {
            var collisionDist = (me.baseLength + body.baseLength) / 2;
            // var potentialCollisionDist = me.stepDistanceRemaining + collisionDist;
            var dx = Math.abs(me.x - body.x);
            var dy = Math.abs(me.y - body.y);
            // if(dx < potentialCollisionDist && dy < potentialCollisionDist) {
            if(dx < collisionDist && dy < collisionDist) {
                var dirToOther = SplitTime.Direction.fromTo(me.x, me.y, body.x, body.y);
                if(SplitTime.Direction.areWithin90Degrees(me.dir, dirToOther)) {
                    //The .pushing here ensures that there is no infinite loop of pushing back and forth
                    if(me.pushy && body.pushy && me.pushedBodies.indexOf(body) < 0) {
                        me._zeldaPushing = true; //prevent counter-push
                        var moved = body.zeldaBump(me._totalStepDistance / 2, me.dir);
                        me._zeldaPushing = false;

                        if(moved) {
                            //Don't repush the same body
                            me.pushedBodies.push(body);

                            //Rerun this iteration of the loop
                            i--;
                            continue;
                        }
                    }
                    //Hit a body we couldn't push
                    return false;
                }
            }
            // refinedNearbyBodies.push(body);
            // }
        }
    }

    // me.nearbyBodies = refinedNearbyBodies;
    return true;
}

/**
 *
 * @param {SplitTime.Body} body
 * @param {number} maxDistance
 */
function zeldaSlide(body, maxDistance) {
    if(body._zeldaSliding) {
        return;
    }

    body._zeldaSliding = true;

    var level = body.getLevel();
    var halfBase = Math.round(body.baseLength / 2);

    var x = Math.round(body.x);
    var y = Math.round(body.y);
    var z = Math.round(body.z);

    var dist = maxDistance; //Math.min(1, maxDistance);

    // Closest diagonal direction positive angle from current direction
    var positiveDiagonal = (Math.round(body.dir + 1.1) - 0.5) % 4;
    // Closest diagonal direction negative angle from current direction
    var negativeDiagonal = (Math.round(body.dir + 3.9) - 0.5) % 4;

    function isCornerOpen(direction, howFarAway) {
        var iCorner = SplitTime.pixCoordToIndex(
            x + SplitTime.Direction.getXSign(direction) * (halfBase + howFarAway),
            y + SplitTime.Direction.getYSign(direction) * (halfBase + howFarAway),
            level.layerFuncData[z]
        );

        return level.layerFuncData[z].data[iCorner] !== 255;
    }

    for(var howFarOut = 1; howFarOut <= 5; howFarOut++) {
        var isCorner1Open = isCornerOpen(positiveDiagonal, howFarOut);
        var isCorner2Open = isCornerOpen(negativeDiagonal, howFarOut);
        if(isCorner1Open && !isCorner2Open) {
            body.zeldaBump(dist, positiveDiagonal);
            break;
        } else if(isCorner2Open && !isCorner1Open) {
            body.zeldaBump(dist, negativeDiagonal);
            break;
        }
    }

    body._zeldaSliding = false;
}

SplitTime.Body.prototype._zeldaBumped = false;
SplitTime.Body.prototype._zeldaPushing = false;
SplitTime.Body.prototype._zeldaSliding = false;

/**
 * Check that body is in current level
 * @param {SplitTime.Body} body
 */
function ensureInLevel(body) {
    if(body.getLevel() !== SplitTime.Level.getCurrent()) {
        throw new Error("Attempt to do zelda movement for body not on current board");
    }
}

/**
 * Called by zeldaStep() for first time pixel of color is crossed
 * @param {SplitTime.Body} body
 * @param {int} r
 * @param {int} g
 * @param {int} b
 * @param {number} a
 */
function crossPixel(body, r, g, b, a) {
    if(r === SplitTime.Trace.RColor.FUNCTION) {
        var level = body.getLevel();
        return level.runFunctionFromBodyCrossPixel(body, r, g, b, a);
    }
}
