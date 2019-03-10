/**
 * A class for arranging bodies for collisions
 * @param {SplitTime.Level} level
 * @constructor
 * @alias SplitTime.Level.BodyOrganizer
 */
function BodyOrganizer(level) {
    this._initialized = false;
    this._waitingBodies = [];
    this._bodySet = {};

    if(level) {
        this.initialize(level);
    }
}

/**
 * @param {SplitTime.Level} level
 */
BodyOrganizer.prototype.initialize = function(level) {
    var maxX32 = Math.ceil(level.width / 32);
    var maxY32 = Math.ceil(level.yWidth / 32);
    var maxZ32 = Math.ceil(level.highestLayerZ / 32);
    this._sortedByXLeft = new BodiesSortedByOneValue(maxX32);
    this._sortedByXRight = new BodiesSortedByOneValue(maxX32);
    this._sortedByYTop = new BodiesSortedByOneValue(maxY32);
    this._sortedByYBottom = new BodiesSortedByOneValue(maxY32);
    this._sortedByZTop = new BodiesSortedByOneValue(maxZ32);
    this._sortedByZBottom = new BodiesSortedByOneValue(maxZ32);

    this._initialized = true;
    for(var i = 0; i < this._waitingBodies.length; i++) {
        this.addBody(this._waitingBodies[i]);
    }
};

/**
 * Register a body with the organizer (such as on level entrance)
 * @param {SplitTime.Body} body
 */
BodyOrganizer.prototype.addBody = function(body) {
    if(this._bodySet[body.ref]) {
        return;
    }

    if(!this._initialized) {
        this._waitingBodies.push(body);
        return;
    }

    this._bodySet[body.ref] = true;

    this._sortedByXLeft.addBody(body);
    this._sortedByXRight.addBody(body);
    this._sortedByYTop.addBody(body);
    this._sortedByYBottom.addBody(body);
    this._sortedByZTop.addBody(body);
    this._sortedByZBottom.addBody(body);

    this.resort(body);
};

/**
 * Deregister a body from the organizer (such as on level exit)
 * @param {SplitTime.Body} body
 */
BodyOrganizer.prototype.removeBody = function(body) {
    if(!this._initialized) {
        for(var i = this._waitingBodies.length - 1; i >= 0; i++) {
            this._waitingBodies.splice(i, 1);
        }
        return;
    }

    this._sortedByXLeft.removeBody(body);
    this._sortedByXRight.removeBody(body);
    this._sortedByYTop.removeBody(body);
    this._sortedByYBottom.removeBody(body);
    this._sortedByZTop.removeBody(body);
    this._sortedByZBottom.removeBody(body);

    this._bodySet[body.ref] = false;
};

/**
 * Force the organizer to resort the body in question.
 * This method assumes all other bodies in the organizer are already sorted.
 * Should be called every time coordinates of body change.
 * @param {SplitTime.Body} body
 */
BodyOrganizer.prototype.resort = function(body) {
    if(!this._initialized) {
        return;
    }

    var halfBaseLength = Math.round(body.baseLength / 2);
    var roundHeight = Math.round(body.height);
    var roundX = Math.round(body.getX());
    var roundY = Math.round(body.getY());
    var roundZ = Math.round(body.getZ());

    this._sortedByXLeft.resortBody(body, roundX - halfBaseLength);
    this._sortedByXRight.resortBody(body, roundX + halfBaseLength);
    this._sortedByYTop.resortBody(body, roundY - halfBaseLength);
    this._sortedByYBottom.resortBody(body, roundY + halfBaseLength);
    this._sortedByZTop.resortBody(body, roundZ + roundHeight);
    this._sortedByZBottom.resortBody(body, roundZ);
};

/**
 * Check if any bodies are present with left at specified x.
 * If so, run callback for each one.
 * @param {int} x
 * @param {function(SplitTime.Body)} [callback]
 * @return {boolean} whether any bodies were found
 */
BodyOrganizer.prototype.forEachXLeft = function(x, callback) {
    return forEachBodyAtValue(x, callback, this._sortedByXLeft);
};

BodyOrganizer.prototype.forEachXRight = function(x, callback) {
    return forEachBodyAtValue(x, callback, this._sortedByXRight);
};

BodyOrganizer.prototype.forEachYTop = function(y, callback) {
    return forEachBodyAtValue(y, callback, this._sortedByYTop);
};

BodyOrganizer.prototype.forEachYBottom = function(y, callback) {
    return forEachBodyAtValue(y, callback, this._sortedByYBottom);
};

BodyOrganizer.prototype.forEachZTop = function(z, callback) {
    return forEachBodyAtValue(z, callback, this._sortedByZTop);
};

BodyOrganizer.prototype.forEachZBottom = function(z, callback) {
    return forEachBodyAtValue(z, callback, this._sortedByZBottom);
};

/**
 * @param {int} value
 * @param {function(SplitTime.Body)} callback
 * @param {BodiesSortedByOneValue} bodiesSortHolder
 * @return {boolean}
 */
function forEachBodyAtValue(value, callback, bodiesSortHolder) {
    if(!bodiesSortHolder) {
        console.warn("Attempting to use BodyOrganizer before initialized");
        return false;
    }

    var index32 = Math.floor(value/32);
    if(index32 >= bodiesSortHolder.valueLookup32.length) {
        index32 = bodiesSortHolder.valueLookup32.length - 1;
    }
    var iSorted = bodiesSortHolder.valueLookup32[index32];
    var iSortedEnd = index32 + 1 < bodiesSortHolder.valueLookup32.length ? bodiesSortHolder.valueLookup32[index32 + 1] : bodiesSortHolder.sortedByValue.length;
    var foundBody = false;
    for(; iSorted < iSortedEnd; iSorted++) {
        var sortedItem = bodiesSortHolder.sortedByValue[iSorted];
        if(sortedItem.value === value) {
            // If the caller just wanted boolean, return early
            if(!callback) {
                return true;
            }
            foundBody = true;
            callback(sortedItem.body);
        // } else if(sortedItem.value > value) {
        //     // Will this optimization help?
        //     return foundBody;
        }
    }
    return foundBody;
}

var BUFFER = 10000;

function BodiesSortedByOneValue(max32Value) {
    this.max32Value = max32Value;
    this.valueLookup32 = new Array(max32Value);
    for(var i = 0; i < this.valueLookup32.length; i++) {
        this.valueLookup32[i] = 1;
    }
    var minSentinel = {
        value: -BUFFER,
        body: { ref: 0 }
    };
    var maxSentinel = {
        value: this._getBeyondMaxValue(),
        body: { ref: 1 }
    };
    this.sortedByValue = [minSentinel, maxSentinel];
    this.reverseSortLookup = [0, 1];
}

BodiesSortedByOneValue.prototype._getBeyondMaxValue = function() {
    return this.max32Value * 32 + BUFFER;
};

BodiesSortedByOneValue.prototype.addBody = function(body) {
    this.sortedByValue.push({
        value: this._getBeyondMaxValue(),
        body: body
    });
    this.reverseSortLookup[body.ref] = this.sortedByValue.length - 1;
};

BodiesSortedByOneValue.prototype.removeBody = function(body) {
    this.resortBody(body, this._getBeyondMaxValue());
    this.sortedByValue.splice(this.reverseSortLookup[body.ref], 1);
    delete this.reverseSortLookup[body.ref];
};

BodiesSortedByOneValue.prototype.resortBody = function(body, value) {
    var currentIndex = this.reverseSortLookup[body.ref];
    var oldValue = this.sortedByValue[currentIndex].value;
    if(value === oldValue) {
        return;
    }
    if(value > oldValue) {
        this.resortBodyUpward(body, value);
    } else if(value < oldValue) {
        this.resortBodyDownward(body, value);
    }
};

BodiesSortedByOneValue.prototype.resortBodyUpward = function(body, value) {
    var currentIndex = this.reverseSortLookup[body.ref];
    var oldValue = this.sortedByValue[currentIndex].value;

    while(currentIndex + 1 < this.sortedByValue.length && this.sortedByValue[currentIndex + 1].value < value) {
        this.sortedByValue[currentIndex] = this.sortedByValue[currentIndex + 1];
        this.reverseSortLookup[this.sortedByValue[currentIndex].body.ref] = currentIndex;
        currentIndex++;
    }
    this.sortedByValue[currentIndex] = {
        body: body,
        value: value
    };
    this.reverseSortLookup[body.ref] = currentIndex;

    // Every boundary crossed must move down
    var index32AboveOldValue = Math.floor(oldValue/32) + 1;
    var index32New = Math.floor(value/32);
    for(var index32 = index32AboveOldValue; index32 < this.valueLookup32.length && index32 <= index32New; index32++) {
        this.valueLookup32[index32]--;
    }
};

BodiesSortedByOneValue.prototype.resortBodyDownward = function(body, value) {
    var currentIndex = this.reverseSortLookup[body.ref];
    var oldValue = this.sortedByValue[currentIndex].value;

    while(currentIndex - 1 >= 0 && this.sortedByValue[currentIndex - 1].value > value) {
        this.sortedByValue[currentIndex] = this.sortedByValue[currentIndex - 1];
        this.reverseSortLookup[this.sortedByValue[currentIndex].body.ref] = currentIndex;
        currentIndex--;
    }
    this.sortedByValue[currentIndex] = {
        body: body,
        value: value
    };
    this.reverseSortLookup[body.ref] = currentIndex;

    // Every boundary crossed must move up
    var index32Old = Math.floor(oldValue/32);
    var index32AboveNew = Math.floor(value/32) + 1;
    for(var index32 = index32AboveNew; index32 < this.valueLookup32.length && index32 <= index32Old; index32++) {
        this.valueLookup32[index32]++;
    }
};

dependsOn("Level.js");
SplitTime.Level.BodyOrganizer = BodyOrganizer;