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

    var whereIsBodyNow = new WhereIsBody(this, body);

    for(var iZ = whereIsBodyNow.minZCellIndex; iZ < whereIsBodyNow.exMaxZCellIndex; iZ++) {
        for(var iY = whereIsBodyNow.minYCellIndex; iY < whereIsBodyNow.exMaxYCellIndex; iY++) {
            for(var iX = whereIsBodyNow.minXCellIndex; iX < whereIsBodyNow.exMaxXCellIndex; iX++) {
                var cell = this._grids[iZ][iY*this._xCells + iX];
                if(SplitTime.Debug.ENABLED) {
                    for(var i = 0; i < cell.length; i++) {
                        if(cell[i] === body) {
                            console.warn("Body " + body.ref + " added to cell more than once");
                            return;
                        }
                    }
                }
                cell.push(body);
            }
        }
    }
    this._whereAreBodies[body.ref] = whereIsBodyNow;
};

/**
 * Deregister a body from the organizer (such as on level exit)
 * @param {SplitTime.Body} body
 */
CellGrid.prototype.removeBody = function(body) {
    if(!this._initialized) {
        for(var iBody = this._waitingBodies.length - 1; iBody >= 0; iBody--) {
            this._waitingBodies.splice(iBody, 1);
        }
        return;
    }

    var whereWasBody = this._whereAreBodies[body.ref];

    for(var iZ = whereWasBody.minZCellIndex; iZ < whereWasBody.exMaxZCellIndex; iZ++) {
        for(var iY = whereWasBody.minYCellIndex; iY < whereWasBody.exMaxYCellIndex; iY++) {
            for(var iX = whereWasBody.minXCellIndex; iX < whereWasBody.exMaxXCellIndex; iX++) {
                var cell = this._grids[iZ][iY*this._xCells + iX];
                for(var i = 0; i < cell.length; i++) {
                    if(cell[i] === body) {
                        cell.splice(i, 1);
                        return;
                    }
                }
            }
        }
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
        if(SplitTime.Debug.ENABLED) {
            for(var i = 0; i < cell.length; i++) {
                if(cell[i] === body) {
                    console.warn("Body " + body.ref + " added to cell more than once");
                    return;
                }
            }
        }
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

    var whitelistAreaUnderBlacklistExMaxZCellIndex = Math.min(whitelistArea.exMaxZCellIndex, blacklistArea.minZCellIndex);
    var whitelistAreaAboveBlacklistMinZCellIndex = Math.max(blacklistArea.exMaxZCellIndex, whitelistArea.minZCellIndex);
    // Visit cells in whitelistArea to the bottom (z) of cells in blacklistArea
    for(iZ = whitelistArea.minZCellIndex; iZ < whitelistAreaUnderBlacklistExMaxZCellIndex; iZ++) {
        for(iY = whitelistArea.minYCellIndex; iY < whitelistArea.exMaxYCellIndex; iY++) {
            for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
                callback(body, iX, iY, iZ);
            }
        }
    }
    // Visit cells in whitelistArea to the top (z) of cells in blacklistArea
    for(iZ = whitelistAreaAboveBlacklistMinZCellIndex; iZ < whitelistArea.exMaxZCellIndex; iZ++) {
        for(iY = whitelistArea.minYCellIndex; iY < whitelistArea.exMaxYCellIndex; iY++) {
            for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
                callback(body, iX, iY, iZ);
            }
        }
    }
    // Visit cells in whitelistArea within z range of blacklistArea
    for(iZ = whitelistAreaUnderBlacklistExMaxZCellIndex; iZ < whitelistAreaAboveBlacklistMinZCellIndex; iZ++) {
        var whitelistAreaTopBlacklistExMaxYCellIndex = Math.min(whitelistArea.exMaxYCellIndex, blacklistArea.minYCellIndex);
        var whitelistAreaBottomBlacklistMinYCellIndex = Math.max(blacklistArea.exMaxYCellIndex, whitelistArea.minYCellIndex);
        // Visit cells in whitelistArea to the top (y) of cells in blacklistArea
        for(iY = whitelistArea.minYCellIndex; iY < whitelistAreaTopBlacklistExMaxYCellIndex; iY++) {
            for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
                callback(body, iX, iY, iZ);
            }
        }
        // Visit cells in whitelistArea to the bottom (y) of cells in blacklistArea
        for(iY = whitelistAreaBottomBlacklistMinYCellIndex; iY < whitelistArea.exMaxYCellIndex; iY++) {
            for(iX = whitelistArea.minXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
                callback(body, iX, iY, iZ);
            }
        }
        // Visit cells in whitelistArea within y range of blacklistArea
        for(iY = whitelistAreaTopBlacklistExMaxYCellIndex; iY < whitelistAreaBottomBlacklistMinYCellIndex; iY++) {
            var whitelistAreaLeftBlacklistExMaxXCellIndex = Math.min(whitelistArea.exMaxXCellIndex, blacklistArea.minXCellIndex);
            var whitelistAreaRightBlacklistMinXCellIndex = Math.max(blacklistArea.exMaxXCellIndex, whitelistArea.minXCellIndex);
            // Visit cells in whitelistArea to the left of cells in blacklistArea
            for(iX = whitelistArea.minXCellIndex; iX < whitelistAreaLeftBlacklistExMaxXCellIndex; iX++) {
                callback(body, iX, iY, iZ);
            }
            // Visit cells in whitelistArea to the right of cells in blacklistArea
            for(iX = whitelistAreaRightBlacklistMinXCellIndex; iX < whitelistArea.exMaxXCellIndex; iX++) {
                callback(body, iX, iY, iZ);
            }
            // We should have hit all cases at this point; so don't need the last loop like the other dimensions
        }
    }
};

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