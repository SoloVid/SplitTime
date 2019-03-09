dependsOn("BodyMover.js");

/**
 * @param {number} maxDZ (positive)
 * @returns {number} Z pixels can move (non-negative)
 */
SplitTime.Body.Mover.prototype.zeldaVerticalRiseTraces = function(maxDZ) {
    var halfBaseLength = Math.round(this.body.baseLength / 2);
    var roundX = Math.round(this.body.getX());
    var roundY = Math.round(this.body.getY());

    var collisionInfo = this.calculateRiseThroughTraces(roundX, roundY, this.body.getZ(), maxDZ);

    this.body.setZ(this.body.getZ() + collisionInfo.distanceAllowed);
    this.level.runFunctions(collisionInfo.functions, this.body);
    return collisionInfo.distanceAllowed;
};

/**
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {number} maxDZ (positive)
 * @returns {{x: number, y: number, distanceAllowed: number, zBlocked: number, zEnd: number, functions: Array}}
 */
SplitTime.Body.Mover.prototype.calculateRiseThroughTraces = function(x, y, z, maxDZ) {
    var top = z + this.height;
    var targetZ = z + maxDZ;
    var targetTop = targetZ + this.height;
    var collisionInfo = {
        x: -1,
        y: -1,
        distanceAllowed: maxDZ,
        zBlocked: targetTop,
        zEnd: targetZ,
        functions: []
    };

    var startX = x - this.halfBaseLength;
    var xPixels = this.baseLength;
    var startY = y - this.halfBaseLength;
    var yPixels = this.baseLength;

    var functionLayerZMap = {};
    var me = this;
    this.level.forEachTraceDataLayerBetween(top, top + maxDZ, function(imageData, layerZ) {
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
                if(a === 255) {
                    if(r === SplitTime.Trace.RColor.SOLID) {
                        // Assuming moving upward through layers, we will hit the bottom of a layer all at the same time
                        // if(restrictivePixel.heightBlocked === null) {
                        collisionInfo.x = x;
                        collisionInfo.y = y;
                        collisionInfo.distanceAllowed = layerZ - top;
                        collisionInfo.zBlocked = layerZ;
                        collisionInfo.zEnd = layerZ - me.height;
                        // Moving up is the easy case
                        return true;
                        // }
                    }
                } else if(r === SplitTime.Trace.RColor.FUNCTION) {
                    var funcId = me.level.getFunctionIdFromPixel(r, g, b, a);
                    if(!(funcId in functionLayerZMap)) {
                        functionLayerZMap[funcId] = layerZ;
                    } else {
                        functionLayerZMap[funcId] = Math.min(functionLayerZMap[funcId], layerZ);
                    }
                }
            }
        }
    });

    for(var funcId in functionLayerZMap) {
        if(functionLayerZMap[funcId] < collisionInfo.zBlocked) {
            collisionInfo.functions.push(funcId);
        }
    }

    return collisionInfo;
};
