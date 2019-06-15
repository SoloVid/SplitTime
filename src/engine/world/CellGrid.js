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
     * @type {SplitTime.Body[][][]}
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
 * Visit all cells in whitelistArea that are not in blacklistArea, calling callback with body and coordinates for each.
 *
 * @param {SplitTime.Body} body
 * @param {WhereIsBody} whitelistArea cells to visit
 * @param {WhereIsBody} blacklistArea cells to ignore
 * @param {function(SplitTime.Body, int, int, int)} callback
 * @private
 */
CellGrid.prototype._adjustCellClaims = function(body, whitelistArea, blacklistArea, callback) {
    var iX, iY, iZ;
    // Visit cells in whitelistArea to the left of cells in blacklistArea
    for(var iLeftX = whitelistArea.minXCellIndex; iLeftX < Math.min(whitelistArea.exMaxXCellIndex, blacklistArea.minXCellIndex); iLeftX++) {
        for(iY = whitelistArea.minYCellIndex; iY < whitelistArea.exMaxYCellIndex; iY++) {
            for(iZ = whitelistArea.minZCellIndex; iZ < whitelistArea.exMaxZCellIndex; iZ++) {
                callback(body, iLeftX, iY, iZ);
            }
        }
    }
    // Visit cells in whitelistArea to the right of cells in blacklistArea
    for(var iRightX = Math.max(blacklistArea.exMaxXCellIndex, whitelistArea.minXCellIndex); iRightX < whitelistArea.exMaxXCellIndex; iRightX++) {
        for(iY = whitelistArea.minYCellIndex; iY < whitelistArea.exMaxYCellIndex; iY++) {
            for(iZ = whitelistArea.minZCellIndex; iZ < whitelistArea.exMaxZCellIndex; iZ++) {
                callback(body, iRightX, iY, iZ);
            }
        }
    }
    // Visit cells in whitelistArea to the top (y) of cells in blacklistArea
    for(var iTopY = whitelistArea.minYCellIndex; iTopY < Math.min(whitelistArea.exMaxYCellIndex, blacklistArea.minYCellIndex); iTopY++) {
        for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
            for(iZ = whitelistArea.minZCellIndex; iZ < whitelistArea.exMaxZCellIndex; iZ++) {
                callback(body, iX, iTopY, iZ);
            }
        }
    }
    // Visit cells in whitelistArea to the bottom (y) of cells in blacklistArea
    for(var iBottomY = Math.max(blacklistArea.exMaxYCellIndex, whitelistArea.minYCellIndex); iBottomY < whitelistArea.exMaxYCellIndex; iBottomY++) {
        for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
            for(iZ = whitelistArea.minZCellIndex; iZ < whitelistArea.exMaxZCellIndex; iZ++) {
                callback(body, iX, iBottomY, iZ);
            }
        }
    }
    // Visit cells in whitelistArea to the bottom (z) of cells in blacklistArea
    for(var iBottomZ = whitelistArea.minZCellIndex; iBottomZ < Math.min(whitelistArea.exMaxZCellIndex, blacklistArea.minZCellIndex); iBottomZ++) {
        for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
            for(iY = whitelistArea.minYCellIndex; iY < whitelistArea.exMaxYCellIndex; iY++) {
                callback(body, iX, iY, iBottomZ);
            }
        }
    }
    // Visit cells in whitelistArea to the top (z) of cells in blacklistArea
    for(var iTopZ = Math.max(blacklistArea.exMaxZCellIndex, whitelistArea.minZCellIndex); iTopZ < whitelistArea.exMaxZCellIndex; iTopZ++) {
        for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
            for(iY = whitelistArea.minYCellIndex; iY < whitelistArea.exMaxYCellIndex; iY++) {
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
 * @param {int} minX
 * @param {int} minY
 * @param {int} minZ
 * @param {int} exMaxX
 * @param {int} exMaxY
 * @param {int} exMaxZ
 * @param {function(SplitTime.Body)} [callback]
 */
CellGrid.prototype.forEachBody = function(minX, minY, minZ, exMaxX, exMaxY, exMaxZ, callback) {
    var bodiesHit = {};
    for(var iCellZ = this.getZIndex(minZ); iCellZ <= this.getZIndex(exMaxZ - 1); iCellZ++) {
        for(var iCellY = this.getYIndex(minY); iCellY <= this.getYIndex(exMaxY - 1); iCellY++) {
            for(var iCellX = this.getXIndex(minX); iCellX <= this.getXIndex(exMaxX - 1); iCellX++) {
                var cell = this._grids[iCellZ][iCellY * this._xCells + iCellX];
                for(var iBody = 0; iBody < cell.length; iBody++) {
                    var body = cell[iBody];
                    if(!bodiesHit[body.ref]) {
                        if(isXOverlap(minX, exMaxX, body) && isYOverlap(minY, exMaxY, body) && isZOverlap(minZ, exMaxZ, body)) {
                            callback(body);
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
 * Map real x coordinate to cell x-coordinate
 * @param {int} x
 * @return {int}
 */
CellGrid.prototype.getXIndex = function(x) {
    return Math.min(Math.max(0, Math.floor(x / PARTITION_SIZE)), this._xCells - 1);
};
/**
 * Map real y coordinate to cell y-coordinate
 * @param {int} y
 * @return {int}
 */
CellGrid.prototype.getYIndex = function(y) {
    return Math.min(Math.max(0, Math.floor(y / PARTITION_SIZE)), this._yCells - 1);
};
/**
 * Map real z coordinate to cell z-coordinate
 * @param {int} z
 * @return {int}
 */
CellGrid.prototype.getZIndex = function(z) {
    return Math.min(Math.max(0, Math.floor(z / PARTITION_SIZE)), this._zCells - 1);
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
        var left = Math.round(body.getLeft());
        var right = left + Math.round(body.baseLength);
        var yTop = Math.round(body.getTopY());
        var yBottom = yTop + Math.round(body.baseLength);
        var zBottom = Math.round(body.getZ());
        var zTop = zBottom + Math.round(body.height);

        this.minXCellIndex = cellGrid.getXIndex(left);
        this.exMaxXCellIndex = cellGrid.getXIndex(right) + 1;
        this.minYCellIndex = cellGrid.getYIndex(yTop);
        this.exMaxYCellIndex = cellGrid.getYIndex(yBottom) + 1;
        this.minZCellIndex = cellGrid.getZIndex(zBottom);
        this.exMaxZCellIndex = cellGrid.getZIndex(zTop) + 1;
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
    var bodyLeft = Math.round(body.getLeft());
    var noOverlap = exMaxX <= bodyLeft || bodyLeft + Math.round(body.baseLength) <= minX;
    return !noOverlap;
}

function isYOverlap(minY, exMaxY, body) {
    var bodyTop = Math.round(body.getTopY());
    var noOverlap = exMaxY <= bodyTop || bodyTop + Math.round(body.baseLength) <= minY;
    return !noOverlap;
}

function isZOverlap(minZ, exMaxZ, body) {
    var bodyBottom = Math.round(body.z);
    var noOverlap = exMaxZ <= body.z || bodyBottom + Math.round(body.height) <= minZ;
    return !noOverlap;
}

dependsOn("Level.js");
SplitTime.Level.CellGrid = CellGrid;