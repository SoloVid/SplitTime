/**
 * A class for arranging bodies for collisions
 * @param {SplitTime.Level} level
 * @constructor
 */
function BodyOrganizer(level) {
    var maxX32 = Math.ceil(level.width / 32);
    var maxY32 = Math.ceil(level.yWidth / 32);
    var maxZ32 = Math.ceil(level.highestLayerZ / 32);
    this._sortedByXLeft = new BodiesSortedByOneValue(maxX32);
    this._sortedByXRight = new BodiesSortedByOneValue(maxX32);
    this._sortedByYTop = new BodiesSortedByOneValue(maxY32);
    this._sortedByYBottom = new BodiesSortedByOneValue(maxY32);
    this._sortedByZTop = new BodiesSortedByOneValue(maxZ32);
    this._sortedByZBottom = new BodiesSortedByOneValue(maxZ32);
}

/**
 * Register a body with the organizer (such as on level entrance)
 * @param {SplitTime.Body} body
 */
BodyOrganizer.prototype.addBody = function(body) {
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
    this._sortedByXLeft.removeBody(body);
    this._sortedByXRight.removeBody(body);
    this._sortedByYTop.removeBody(body);
    this._sortedByYBottom.removeBody(body);
    this._sortedByZTop.removeBody(body);
    this._sortedByZBottom.removeBody(body);
};

/**
 * Force the organizer to resort the body in question.
 * This method assumes all other bodies in the organizer are already sorted.
 * Should be called every time coordinates of body change.
 * @param {SplitTime.Body} body
 */
BodyOrganizer.prototype.resort = function(body) {
    var halfBaseLength = Math.round(body.baseLength / 2);
    var roundHeight = Math.round(body.height);
    var roundX = Math.round(body.x);
    var roundY = Math.round(body.y);
    var roundZ = Math.round(body.z);

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
 * @param {function(SplitTime.Body)} callback
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
            foundBody = true;
            callback(sortedItem.body);
        // } else if(sortedItem.value > value) {
        //     // Will this optimization help?
        //     return foundBody;
        }
    }
    return foundBody;
}

function BodiesSortedByOneValue(maxValue) {
    this.maxValue = maxValue;
    this.valueLookup32 = new Array(maxValue);
    this.sortedByValue = [];
    this.reverseSortLookup = [];
}

BodiesSortedByOneValue.prototype.addBody = function(body) {
    this.sortedByValue.push({
        value: this.maxValue + 10000,
        body: body
    });
    this.reverseSortLookup[body.ref] = this.sortedByValue.length - 1;
};

BodiesSortedByOneValue.prototype.removeBody = function(body) {
    this.resortBody(body, this.maxValue + 10000);
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

    // Only boundary markers greater than the old value and less than the new value may have shifted
    for(var index32 = Math.floor(oldValue/32) + 1; index32 <= Math.floor(value/32); index32++) {
        var iSorted = this.valueLookup32[index32];
        // The only chance of change is that a boundary needs to point one lower
        if(this.sortedByValue[iSorted - 1].value/32 > index32) {
            this.valueLookup32[index32] = iSorted - 1;
        } else {
            // nobody later is going to move either
            break;
        }
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

    // Only boundary markers less than the old value and greater than the new value may have shifted
    for(var index32 = Math.ceil(oldValue/32) - 1; index32 >= Math.ceil(value/32); index32--) {
        var iSorted = this.valueLookup32[index32];
        // The only chance of change is that a boundary needs to point one higher
        if(this.sortedByValue[iSorted + 1].value/32 < index32) {
            this.valueLookup32[index32] = iSorted + 1;
        } else {
            // nobody later is going to move either
            break;
        }
    }
};
