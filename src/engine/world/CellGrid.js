/**
 * A class for arranging bodies for collisions
 * @param {SplitTime.Level} [level]
 * @constructor
 * @alias SplitTime.Level.CellGrid
 */
function CellGrid(level) {
    this._initialized = false;
    this._waitingBodies = [];
    /**
     * @type {Object.<int, WhereIsBody>}
     * @private
     */
    this._whereAreBodies = {};

    /**
     * @type {SplitTime.Body[][]}
     * @private
     */
    this._grids = [];

    if(level) {
        this.initialize(level);
    }
}

var PARTITION_SIZE = 32;

/**
 * @param {SplitTime.Level} level
 */
CellGrid.prototype.initialize = function(level) {
    this._level = level;
    // TODO: implement
    this._xCells = Math.ceil(level.width / PARTITION_SIZE);
    this._yCells = Math.ceil(level.yWidth / PARTITION_SIZE);
    this._zCells = Math.ceil(level.highestLayerZ / PARTITION_SIZE) + 1;
    for(var iLayer = 0; iLayer < this._zCells; iLayer++) {
        this._grids[iLayer] = [];
        for(var iCell = 0; iCell < this._xCells * this._yCells; iCell++) {
            this._grids[iLayer][iCell] = [];
        }
    }

    this._initialized = true;
    for(var i = 0; i < this._waitingBodies.length; i++) {
        this.addBody(this._waitingBodies[i]);
    }
};

/**
 * Register a body with the organizer (such as on level entrance)
 * @param {SplitTime.Body} body
 */
CellGrid.prototype.addBody = function(body) {
    if(this._whereAreBodies[body.ref]) {
        return;
    }

    if(!this._initialized) {
        this._waitingBodies.push(body);
        return;
    }

    this._whereAreBodies[body.ref] = true;

    // TODO: implement

    this.resort(body);
};

/**
 * Deregister a body from the organizer (such as on level exit)
 * @param {SplitTime.Body} body
 */
CellGrid.prototype.removeBody = function(body) {
    if(!this._initialized) {
        for(var i = this._waitingBodies.length - 1; i >= 0; i++) {
            this._waitingBodies.splice(i, 1);
        }
        return;
    }

    var whereWasBody = this._whereAreBodies[body.ref];
    var whereIsBodyNow = new WhereIsBody(this);

    var me = this;
    function removeFromCell(body, x, y, z) {
        var cell = me._grids[z][y*me._xCells + x];
        for(var i = 0; i < cell.length; i++) {
            if(cell[i] === body) {
                cell.splice(i, 1);
                return;
            }
        }
    }

    if(whereWasBody) {
        this._adjustCellClaims(body, whereWasBody, whereIsBodyNow, removeFromCell);
    }

    this._whereAreBodies[body.ref] = undefined;
};

/**
 * Force the organizer to resort the body in question.
 * This method assumes all other bodies in the organizer are already sorted.
 * Should be called every time coordinates of body change.
 * @param {SplitTime.Body} body
 */
CellGrid.prototype.resort = function(body) {
    if(!this._initialized) {
        return;
    }

    var whereWasBody = this._whereAreBodies[body.ref] || new WhereIsBody(this);
    var whereIsBodyNow = new WhereIsBody(this, body);

    var me = this;
    function removeFromCell(body, x, y, z) {
        var cell = me._grids[z][y*me._xCells + x];
        for(var i = 0; i < cell.length; i++) {
            if(cell[i] === body) {
                cell.splice(i, 1);
                return;
            }
        }
    }

    function addToCell(body, x, y, z) {
        var cell = me._grids[z][y*me._xCells + x];
        cell.push(body);
    }

    this._adjustCellClaims(body, whereWasBody, whereIsBodyNow, removeFromCell);
    this._adjustCellClaims(body, whereIsBodyNow, whereWasBody, addToCell);

    this._whereAreBodies[body.ref] = whereIsBodyNow;
};

/**
 *
 * @param {SplitTime.Body} body
 * @param {WhereIsBody} largerClaim
 * @param {WhereIsBody} smallerClaim
 * @param {function(SplitTime.Body, int, int, int)} callback
 * @private
 */
CellGrid.prototype._adjustCellClaims = function(body, largerClaim, smallerClaim, callback) {
    var iX, iY, iZ;
    // Visit cells in largerClaim to the left of cells in smallerClaim
    for(var iLeftX = largerClaim.minXCellIndex; iLeftX < Math.min(largerClaim.exMaxXCellIndex, smallerClaim.minXCellIndex); iLeftX++) {
        for(iY = largerClaim.minYCellIndex; iY < largerClaim.exMaxYCellIndex; iY++) {
            for(iZ = largerClaim.minZCellIndex; iZ < largerClaim.exMaxZCellIndex; iZ++) {
                callback(body, iLeftX, iY, iZ);
            }
        }
    }
    // Visit cells in largerClaim to the right of cells in smallerClaim
    for(var iRightX = Math.max(smallerClaim.exMaxXCellIndex, largerClaim.minXCellIndex); iRightX < largerClaim.exMaxXCellIndex; iRightX++) {
        for(iY = largerClaim.minYCellIndex; iY < largerClaim.exMaxYCellIndex; iY++) {
            for(iZ = largerClaim.minZCellIndex; iZ < largerClaim.exMaxZCellIndex; iZ++) {
                callback(body, iLeftX, iY, iZ);
            }
        }
    }
    // Visit cells in largerClaim to the top (y) of cells in smallerClaim
    for(var iTopY = largerClaim.minYCellIndex; iTopY < Math.min(largerClaim.exMaxYCellIndex, smallerClaim.minYCellIndex); iTopY++) {
        for(iX = largerClaim.minXCellIndex; iX < largerClaim.exMaxXCellIndex; iX++) {
            for(iZ = largerClaim.minZCellIndex; iZ < largerClaim.exMaxZCellIndex; iZ++) {
                callback(body, iX, iTopY, iZ);
            }
        }
    }
    // Visit cells in largerClaim to the bottom (y) of cells in smallerClaim
    for(var iBottomY = Math.max(smallerClaim.exMaxYCellIndex, largerClaim.minYCellIndex); iBottomY < largerClaim.exMaxYCellIndex; iBottomY++) {
        for(iX = largerClaim.minXCellIndex; iX < largerClaim.exMaxXCellIndex; iX++) {
            for(iZ = largerClaim.minZCellIndex; iZ < largerClaim.exMaxZCellIndex; iZ++) {
                callback(body, iX, iBottomY, iZ);
            }
        }
    }
    // Visit cells in largerClaim to the bottom (z) of cells in smallerClaim
    for(var iBottomZ = largerClaim.minZCellIndex; iBottomZ < Math.min(largerClaim.exMaxZCellIndex, smallerClaim.minZCellIndex); iBottomZ++) {
        for(iX = largerClaim.minXCellIndex; iX < largerClaim.exMaxXCellIndex; iX++) {
            for(iY = largerClaim.minYCellIndex; iY < largerClaim.exMaxYCellIndex; iY++) {
                callback(body, iX, iY, iBottomZ);
            }
        }
    }
    // Visit cells in largerClaim to the top (z) of cells in smallerClaim
    for(var iTopZ = Math.max(smallerClaim.exMaxZCellIndex, largerClaim.minZCellIndex); iTopZ < largerClaim.exMaxZCellIndex; iTopZ++) {
        for(iX = largerClaim.minXCellIndex; iX < largerClaim.exMaxXCellIndex; iX++) {
            for(iY = largerClaim.minYCellIndex; iY < largerClaim.exMaxYCellIndex; iY++) {
                callback(body, iX, iY, iTopZ);
            }
        }
    }
};

// /**
//  * Check if any bodies are present with left at specified x.
//  * If so, run callback for each one.
//  * @param {int} x
//  * @param {function(SplitTime.Body)} [callback]
//  * @return {boolean} whether any bodies were found
//  */
// CellGrid.prototype.forEachXLeft = function(x, callback) {
//     return forEachBodyAtValue(x, callback, this._sortedByXLeft);
// };
//
// CellGrid.prototype.forEachXRight = function(x, callback) {
//     return forEachBodyAtValue(x, callback, this._sortedByXRight);
// };
//
// CellGrid.prototype.forEachYTop = function(y, callback) {
//     return forEachBodyAtValue(y, callback, this._sortedByYTop);
// };
//
// CellGrid.prototype.forEachYBottom = function(y, callback) {
//     return forEachBodyAtValue(y, callback, this._sortedByYBottom);
// };
//
// CellGrid.prototype.forEachZTop = function(z, callback) {
//     return forEachBodyAtValue(z, callback, this._sortedByZTop);
// };
//
// CellGrid.prototype.forEachZBottom = function(z, callback) {
//     return forEachBodyAtValue(z, callback, this._sortedByZBottom);
// };

/**
 *
 * @param minX
 * @param minY
 * @param minZ
 * @param exMaxX
 * @param exMaxY
 * @param exMaxZ
 * @param {function(SplitTime.Body)} [callback]
 */
CellGrid.prototype.forEachBody = function(minX, minY, minZ, exMaxX, exMaxY, exMaxZ, callback) {
    var bodiesHit = {};
    for(var iX = minX; iX < exMaxX; iX += PARTITION_SIZE) {
        for(var iY = minY; iY < exMaxY; iY += PARTITION_SIZE) {
            for(var iZ = minZ; iZ < exMaxZ; iZ += PARTITION_SIZE) {
                var cell = this.getCellAt(iX, iY, iZ);
                for(var iBody = 0; iBody < cell.length; iBody++) {
                    var body = cell[iBody];
                    if(!bodiesHit[body.ref]) {
                        if(isXOverlap(minX, exMaxX, body) && isYOverlap(minY, exMaxY, body) && isZOverlap(minZ, exMaxZ, body)) {
                            callback(cell[iBody]);
                        }
                    }
                    bodiesHit[body.ref] = true;
                }
            }
        }
    }
};

/**
 * @param x
 * @param y
 * @param z
 * @return {SplitTime.Body}
 */
CellGrid.prototype.getCellAt = function(x, y, z) {
    return this._grids[this.getZIndex(z)][this.getFlatIndex(x, y)];
};

/**
 * @param {number} x
 * @return {int}
 */
CellGrid.prototype.getXIndex = function(x) {
    return Math.min(Math.max(0, Math.floor(x / PARTITION_SIZE)), this._xCells);
};
/**
 * @param {number} y
 * @return {int}
 */
CellGrid.prototype.getYIndex = function(y) {
    return Math.min(Math.max(0, Math.floor(y / PARTITION_SIZE)), this._yCells);
};
/**
 * @param {number} z
 * @return {int}
 */
CellGrid.prototype.getZIndex = function(z) {
    return Math.min(Math.max(0, Math.floor(z / PARTITION_SIZE)), this._zCells);
};

/**
 * @param x
 * @param y
 * @return {int}
 */
CellGrid.prototype.getFlatIndex = function(x, y) {
    return (this.getYIndex(y)*this._xCells + this.getXIndex(x));
};

/**
 * @param {SplitTime.Level.CellGrid} cellGrid
 * @param {SplitTime.Body} [body]
 * @constructor
 */
function WhereIsBody(cellGrid, body) {
    if(body) {
        var halfBaseLength = Math.round(body.baseLength / 2);

        var left = body.getX() - halfBaseLength;
        var right = body.getX() + halfBaseLength;
        var yTop = body.getY() - halfBaseLength;
        var yBottom = body.getY() + halfBaseLength;
        var zTop = body.getZ() + body.height;
        var zBottom = body.getZ();

        this.minXCellIndex = cellGrid.getXIndex(left);
        this.exMaxXCellIndex = cellGrid.getXIndex(right);
        this.minYCellIndex = cellGrid.getYIndex(yTop);
        this.exMaxYCellIndex = cellGrid.getYIndex(yBottom);
        this.minZCellIndex = cellGrid.getZIndex(zBottom);
        this.exMaxZCellIndex = cellGrid.getZIndex(zTop);
    } else {
        this.minXCellIndex = cellGrid._xCells;
        this.exMaxXCellIndex = -1;
        this.minYCellIndex = cellGrid._yCells;
        this.exMaxYCellIndex = -1;
        this.minZCellIndex = cellGrid._zCells;
        this.exMaxZCellIndex = -1;
    }
}

function isXOverlap(minX, exMaxX, body) {
    var bodyLeft = body.x - body.baseLength / 2;
    var noOverlap = exMaxX < bodyLeft || bodyLeft + body.baseLength < minX;
    return !noOverlap;
}

function isYOverlap(minY, exMaxY, body) {
    var bodyTop = body.y - body.baseLength / 2;
    var noOverlap = exMaxY < bodyTop || bodyTop + body.baseLength < minY;
    return !noOverlap;
}

function isZOverlap(minZ, exMaxZ, body) {
    var bodyTop = body.z + body.height;
    var noOverlap = exMaxZ < body.z || bodyTop < minZ;
    return !noOverlap;
}

dependsOn("Level.js");
SplitTime.Level.CellGrid = CellGrid;