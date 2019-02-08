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
 * Advances SplitTime.Body person up to maxDistance pixels as far as is legal.
 * Includes pushing other Bodys out of the way?
 * @param {number} maxDistance
 * @returns {number} distance actually moved
 */
SplitTime.Body.prototype.zeldaStep = function(maxDistance) {
    ensureInLevel(this);
    var level = this.getLevel();

    var dy = -maxDistance * Math.sin((this.dir) * (Math.PI / 2)); //Total y distance to travel
    var dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy);
    var ady = Math.abs(dyRounded);

    var dx = maxDistance * Math.cos((this.dir) * (Math.PI / 2)); //Total x distance to travel
    var dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx);
    var adx = Math.abs(dxRounded);

    var jHat = dyRounded / ady;
    var iHat = dxRounded / adx;

    this._totalStepDistance = maxDistance;
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

    var roundX = Math.round(this.x);
    var roundY = Math.round(this.y);
    var currentZ = this.z;
    var halfBaseLength = Math.round(this.baseLength / 2);

    for(var i = 0; i < maxIterations; i++) {
        if(xPixelsRemaining > 0) {
            roundX += iHat;
            if(roundX >= level.width || roundX < 0) {
                outX = true;
            } else {
                var edgeX = dx > 0 ? roundX + halfBaseLength : roundX - halfBaseLength;
                var top = roundY - halfBaseLength;
                stoppedX = !checkAreaCollision(level, edgeX, 1, top, this.baseLength, currentZ, this.height);
                if(stoppedX) {
                    var VERTICAL_FUDGE = 4;
                    var zBeforeFudge = currentZ;
                    currentZ = calculateRiseThroughTraces(level, roundX - halfBaseLength, this.baseLength, top, this.baseLength, currentZ, this.height, VERTICAL_FUDGE).zEnd;
                    stoppedX = !checkAreaCollision(level, edgeX, 1, top, this.baseLength, currentZ, this.height);
                    if(!stoppedX) {
                        currentZ = calculateDropThroughTraces(level, roundX - halfBaseLength, this.baseLength, top, this.baseLength, currentZ, VERTICAL_FUDGE).zBlocked;
                    } else {
                        currentZ = zBeforeFudge;
                    }
                }
            }

            // this.stepDistanceRemaining--;

            if(stoppedX || outX) {
                roundX -= iHat;
            } else {
                xPixelsRemaining--;
                pixelsMovedX++;
            }
        }

        if(yPixelsRemaining > 0) {
            roundY += jHat;
            //Check if out of bounds
            if(roundY >= level.yWidth || roundY < 0) {
                outY = true;
            } else {
                var edgeY = dy > 0 ? roundY + halfBaseLength : roundY - halfBaseLength;
                var left = roundX - halfBaseLength;
                stoppedY = !checkAreaCollision(level, left, this.baseLength, edgeY, 1, this.z, this.height);
            }

            if(stoppedY || outY) {
                roundY -= jHat;
            } else {
                yPixelsRemaining--;
                pixelsMovedY++;
            }
        }
    }
    var oldX = this.x;
    var oldY = this.y;
    if(ady > 0 && !stoppedY && !outY) {
        // Subtract off any overshoot
        this.y = roundY - (dyRounded - dy);
    } else {
        this.y = roundY;
    }
    if(adx > 0 && !stoppedX && !outX) {
        // Subtract off any overshoot
        this.x = roundX - (dxRounded - dx);
    } else {
        this.x = roundX;
    }
    this.z = currentZ;

    this.nearbyBodies = null;
    this.pushedBodies = null;
    // this.stepDistanceRemaining = null;

    //If stopped, help person out by sliding around corner
    var stopped = stoppedX || stoppedY;
    var out = outX || outY;
    if(stopped && !out && pixelsMovedX + pixelsMovedY < maxDistance / 2) {
        zeldaSlide(this, maxDistance / 2);
    }

    return SplitTime.Measurement.distanceTrue(oldX, oldY, this.x, this.y);
};

/**
 * Check that the last moved pixel is allowed.
 * @param {SplitTime.Body} body
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @returns {boolean}
 */
function zeldaCheckHorizontalArea(body, startX, xPixels, startY, yPixels) {
    return zeldaCheckStepTraces(body, startX, xPixels, startY, yPixels);// && zeldaCheckStepBodies(body);
}

/**
 * @param {SplitTime.Body} body
 * @param {number} coordinate
 * @param {function(int)} callback
 */
function forEachPixelAlongBase(body, coordinate, callback) {
    for(var i = -body.baseLength / 2; i < body.baseLength / 2; i++) {
        var retVal = callback(Math.round(coordinate + i));
        if(retVal !== undefined) {
            return;
        }
    }
}

/**
 * @param {ImageData} data
 * @param {int} x
 * @param {int} y
 * @param {function(int, int, int, int)} callback
 */
function withPixelColor(data, x, y, callback) {
    var dataIndex = SplitTime.pixCoordToIndex(x, y, data);
    var r = data.data[dataIndex++];
    var g = data.data[dataIndex++];
    var b = data.data[dataIndex++];
    var a = data.data[dataIndex++];
    callback(r, g, b, a);
}

/**
 * Check that the area is open in level collision canvas data.
 * @param {SplitTime.Level} level
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {number} z
 * @param {number} height
 * @returns {boolean}
 */
function checkAreaCollision(level, startX, xPixels, startY, yPixels, z, height) {
    var stopped = false;
    level.forEachTraceDataLayerBetween(z, z + height, function(imageData, layerZ) {
        // console.log("checking layer " + layerZ);
        //Loop through width of base
        for(var y = startY; y < startY + yPixels; y++) {
            for(var x = startX; x < startX + xPixels; x++) {
                // forEachPixelAlongBase(body, body[altAxis], function(coordinate) {
                // coords[altAxis] = Math.round(body[altAxis] + i);
                // coords[altAxis] = coordinate;
                var dataIndex = SplitTime.pixCoordToIndex(x, y, imageData);
                var r = imageData.data[dataIndex++];
                var g = imageData.data[dataIndex++];
                var b = imageData.data[dataIndex++];
                var a = imageData.data[dataIndex++];
                // withPixelColor(imageData, coords.x, coords.y, function(r, g, b, a) {
                if(r === SplitTime.Trace.RColor.SOLID) {
                    var height = g;
                    if(height > 0) {
                        if(layerZ + height <= z || z + height <= layerZ) {
                            // do nothing
                        } else {
                            stopped = true;
                            return true;
                        }
                    }
                // } else if(a === 255) {
                //     // Since traces are drawn inexactly, we can't rely on colors with alpha not 100%
                //     var colorId = r + "," + g + "," + b + "," + a;
                //     if(body._pixelsCrossed[colorId] === undefined) {
                //         try {
                //             body._pixelsCrossed[colorId] = crossPixel(body, r, g, b, a) !== false;
                //         }
                //         catch(ex) {
                //             console.error(ex);
                //         }
                //     }
                //     if(!body._pixelsCrossed[colorId]) {
                //         stopped = true;
                //         return true;
                //     }
                }
                // });
                // });
                // if(stopped) {
                //     return true;
                // }
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
        var open = true;
        level.forEachRelevantTraceDataLayer(body, function(data) {
            var iCorner = SplitTime.pixCoordToIndex(
                x + SplitTime.Direction.getXSign(direction) * (halfBase + howFarAway),
                y + SplitTime.Direction.getYSign(direction) * (halfBase + howFarAway),
                data
            );

            if(data.data[iCorner] === SplitTime.Trace.RColor.SOLID) {
                open = false;
                return true;
            }
        });
        return open;
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

SplitTime.Body.prototype._zeldaPreviousGroundBody = null;
SplitTime.Body.prototype._zeldaPreviousGroundTraceX = null;
SplitTime.Body.prototype._zeldaPreviousGroundTraceY = null;
SplitTime.Body.prototype._zeldaPreviousGroundTraceZ = null;


/**
 * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
 * @param {number} maxZ
 * @returns {number} Z pixels actually moved
 */
SplitTime.Body.prototype.zeldaVerticalBump = function(maxZ) {
    return zeldaVerticalBumpImpl(this, maxZ);
};

/**
 * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
 * @param {SplitTime.Body} body
 * @param {number} maxDZ
 * @returns {number} Z pixels actually moved
 */
function zeldaVerticalBumpImpl(body, maxDZ) {
    ensureInLevel(body);
    var level = body.getLevel();

    var groundBody = body._zeldaPreviousGroundBody;
    if(groundBody && isStandingOnBody(body, groundBody)) {
        return 0;
    }
    body._zeldaPreviousGroundBody = null;
    if(maxDZ < 0 && isGroundTracePixelRelevant(body, body._zeldaPreviousGroundTraceX, body._zeldaPreviousGroundTraceY, body._zeldaPreviousGroundTraceZ)) {
        return 0;
    }
    body._zeldaPreviousGroundTraceX = null;
    body._zeldaPreviousGroundTraceY = null;
    body._zeldaPreviousGroundTraceZ = null;

    var traceDZ;
    if(Math.abs(maxDZ) < 0.000001) {
        // do nothing
        return 0;
    } else if(maxDZ > 0) {
        traceDZ = zeldaVerticalRiseTraces(body, maxDZ);
        // TODO: check bodies
        return traceDZ;
    } else {
        traceDZ = zeldaVerticalDropTraces(body, -maxDZ);
        // TODO: check bodies
        return traceDZ;
    }
}

/**
 * @param {SplitTime.Body} body
 * @param {number} maxDZ (positive)
 * @returns {number} Z pixels can move (non-negative)
 */
function zeldaVerticalRiseTraces(body, maxDZ) {
    var halfBaseLength = Math.round(body.baseLength / 2);
    var roundX = Math.round(body.x);
    var roundY = Math.round(body.y);

    var collisionInfo = calculateRiseThroughTraces(
        body.getLevel(),
        roundX - halfBaseLength, body.baseLength,
        roundY - halfBaseLength, body.baseLength,
        body.z, body.height, maxDZ
    );

    body.z += collisionInfo.distanceAllowed;
    return collisionInfo.distanceAllowed;
}

/**
 * @param {SplitTime.Level} level
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {number} z
 * @param {number} height
 * @param {number} maxDZ (positive)
 * @returns {{x: number, y: number, distanceAllowed: number, zBlocked: number, zEnd: number, functions: Array}}
 */
function calculateRiseThroughTraces(level, startX, xPixels, startY, yPixels, z, height, maxDZ) {
    var top = z + height;
    var targetZ = z + maxDZ;
    var targetTop = targetZ + height;
    var collisionInfo = {
        x: -1,
        y: -1,
        distanceAllowed: maxDZ,
        zBlocked: targetTop,
        zEnd: targetZ,
        functions: []
    };

    level.forEachTraceDataLayerBetween(top, top + maxDZ, function(imageData, layerZ) {
        if(layerZ <= z || layerZ > collisionInfo.zBlocked) {
            return;
        }
        //Loop through width of base
        for(var y = startY; y < startY + yPixels; y++) {
            //Loop through height of base
            for(var x = startX; x < startX + xPixels; x++) {
                var dataIndex = SplitTime.pixCoordToIndex(x, y, imageData);
                var r = imageData.data[dataIndex++];
                var g = imageData.data[dataIndex++];
                var b = imageData.data[dataIndex++];
                var a = imageData.data[dataIndex++];
                if(r === SplitTime.Trace.RColor.SOLID) {
                    // Assuming moving upward through layers, we will hit the bottom of a layer all at the same time
                    // if(restrictivePixel.heightBlocked === null) {
                    collisionInfo.x = x;
                    collisionInfo.y = y;
                    collisionInfo.distanceAllowed = layerZ - top;
                    collisionInfo.zBlocked = layerZ;
                    collisionInfo.zEnd = layerZ - height;
                    // Moving up is the easy case
                    return true;
                    // }
                }
                // else if(a === 255) {
                //     // Since traces are drawn inexactly, we can't rely on colors with alpha not 100%
                //     var colorId = r + "," + g + "," + b + "," + a;
                //     if(body._pixelsCrossed[colorId] === undefined) {
                //         try {
                //             body._pixelsCrossed[colorId] = crossPixel(body, r, g, b, a) !== false;
                //         }
                //         catch(ex) {
                //             console.error(ex);
                //         }
                //     }
                //     if(!body._pixelsCrossed[colorId]) {
                //         return stopped = true;
                //     }
                // }
            }
        }
    });

    return collisionInfo;
}

/**
 * @param {SplitTime.Body} body
 * @param {number} maxDZ (positive)
 * @returns {number} Z pixels moved (non-positive)
 */
function zeldaVerticalDropTraces(body, maxDZ) {

    var halfBaseLength = Math.round(body.baseLength / 2);
    var roundX = Math.round(body.x);
    var roundY = Math.round(body.y);

    var collisionInfo = calculateDropThroughTraces(
        body.getLevel(),
        roundX - halfBaseLength, body.baseLength,
        roundY - halfBaseLength, body.baseLength,
        body.z, maxDZ
    );

    body.z = collisionInfo.zBlocked;
    if(collisionInfo.x >= 0) {
        body._zeldaPreviousGroundTraceX = collisionInfo.x;
        body._zeldaPreviousGroundTraceY = collisionInfo.y;
        body._zeldaPreviousGroundTraceZ = collisionInfo.zBlocked;
    }
    return -collisionInfo.distanceAllowed;
}

/**
 * @param {SplitTime.Level} level
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{x: number, y: number, distanceAllowed: number, zBlocked: number, functions: string[]}}
 */
function calculateDropThroughTraces(level, startX, xPixels, startY, yPixels, z, maxDZ) {
    var targetZ = z - maxDZ;
    var collisionInfo = {
        x: -1,
        y: -1,
        // positive number
        distanceAllowed: maxDZ,
        zBlocked: targetZ,
        functions: []
    };

    if(z <= 0) {
        collisionInfo.distanceAllowed = 0;
        collisionInfo.zBlocked = 0;
        return collisionInfo;
    } else if(targetZ <= 0) {
        collisionInfo.distanceAllowed = z;
        collisionInfo.zBlocked = 0;
    }

    var potentialFunctionsMap = {};
    var potentialFunctions = [];
    level.forEachTraceDataLayerBetween(targetZ, z + 1, function(imageData, layerZ, nextLayerZ) {
        // console.log("Checking sink trace at z = " + layerZ);
        //Loop through width of base
        for(var y = startY; y < startY + yPixels; y++) {
            //Loop through height of base
            for(var x = startX; x < startX + xPixels; x++) {
                var dataIndex = SplitTime.pixCoordToIndex(x, y, imageData);
                var r = imageData.data[dataIndex++]; // pixel type
                var g = imageData.data[dataIndex++]; // height if solid
                var b = imageData.data[dataIndex++];
                var a = imageData.data[dataIndex++];
                if(a === 255) {
                    if(r === SplitTime.Trace.RColor.SOLID) {
                        // console.log("g = " + g);
                        var zBlocked = layerZ + g;
                        if(collisionInfo.zBlocked === null || collisionInfo.zBlocked < zBlocked) {
                            collisionInfo.x = x;
                            collisionInfo.y = y;
                            collisionInfo.distanceAllowed = z - zBlocked;
                            collisionInfo.zBlocked = zBlocked;

                            if(collisionInfo.distanceAllowed <= 0) {
                                return true;
                            }
                        }
                    } else if(r === SplitTime.Trace.RColor.FUNCTION) {
                        var funcId = level.getFunctionIdFromPixel(r, g, b, a);
                        var funcDetails = potentialFunctionsMap[funcId];
                        if(!funcDetails) {
                            funcDetails = {
                                id: funcId,
                                nextLayerZ: nextLayerZ
                            };
                            potentialFunctionsMap[funcId] = funcDetails;
                            potentialFunctions.push(funcId);
                        } else {
                            funcDetails.nextLayerZ = Math.max(funcDetails.nextLayerZ, nextLayerZ);
                        }
                    }
                }
            }
        }
    });

    for(var iFunc = 0; iFunc < potentialFunctions.length; iFunc++) {
        if(potentialFunctions[iFunc].nextLayerZ >= collisionInfo.zBlocked) {
            collisionInfo.functions.push(potentialFunctions[iFunc].id);
        }
    }

    return collisionInfo;
}

/**
 * @param {SplitTime.Body} standingBody
 * @param {SplitTime.Body} groundBody
 * @returns {boolean}
 */
function isStandingOnBody(standingBody, groundBody) {
    return false;
    // TODO
    // Check for perfect groundBody.z + groundBody.height === standingBody.z
    // Then check for horizontal overlap of bases
}

function isGroundTracePixelRelevant(body, x, y, z) {
    if(body._zeldaPreviousGroundTraceX && body._zeldaPreviousGroundTraceY && body._zeldaPreviousGroundTraceZ) {
        // TODO
        // Check if body still covers x and y
        // If so, check that z matches pixel
    }
    return false;
}