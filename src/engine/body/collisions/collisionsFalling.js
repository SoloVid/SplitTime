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

    var potentialFunctionsMap = {};
    var potentialFunctions = [];
    var me = this;
    this.level.forEachTraceDataLayerBetween(targetZ, z + 1, function(imageData, layerZ, nextLayerZ) {
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
                        var funcId = me.level.getFunctionIdFromPixel(r, g, b, a);
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
};

