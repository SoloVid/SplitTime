import { int } from "../splitTime";
const BUFFER = 10000;
export class DataSortedByOneValue {
    private readonly bucketSize: int;
    private readonly maxValue: int;
    private readonly valueLookup32: number[];
    private readonly sortedByValue: {
        value: number;
        ref: number;
        object: {};
    }[];
    private readonly reverseSortLookup: {
        [ref: number]: int;
    };
    constructor(maxValue: int, bucketSize: int = 32) {
        this.bucketSize = bucketSize;
        this.maxValue = maxValue;
        this.valueLookup32 = new Array(Math.ceil(maxValue / this.bucketSize));
        for (var i = 0; i < this.valueLookup32.length; i++) {
            this.valueLookup32[i] = 1;
        }
        var minSentinel = {
            value: -BUFFER,
            ref: 0,
            object: {}
        };
        var maxSentinel = {
            value: this._getBeyondMaxValue(),
            ref: 1,
            object: {}
        };
        this.sortedByValue = [minSentinel, maxSentinel];
        this.reverseSortLookup = {};
        this.reverseSortLookup[0] = 0;
        this.reverseSortLookup[1] = 1;
    }
    private _getBeyondMaxValue() {
        return this.maxValue + BUFFER;
    }
    add(ref: int, object: object) {
        this.sortedByValue.push({
            value: this._getBeyondMaxValue(),
            ref: ref,
            object: object
        });
        this.reverseSortLookup[ref] = this.sortedByValue.length - 1;
    }
    remove(ref: int) {
        this.resort(ref, this._getBeyondMaxValue());
        this.sortedByValue.splice(this.reverseSortLookup[ref], 1);
        delete this.reverseSortLookup[ref];
    }
    resort(ref: int, value: number) {
        if (Math.floor(value) !== value) {
            console.warn("Non-integer value: " + value);
        }
        var currentIndex = this.reverseSortLookup[ref];
        var oldValue = this.sortedByValue[currentIndex].value;
        if (value === oldValue) {
            return;
        }
        if (value > oldValue) {
            this.resortUpward(ref, value);
        }
        else if (value < oldValue) {
            this.resortDownward(ref, value);
        }
    }
    private resortUpward(ref: number, value: number) {
        var currentIndex = this.reverseSortLookup[ref];
        var oldObject = this.sortedByValue[currentIndex].object;
        var oldValue = this.sortedByValue[currentIndex].value;
        while (currentIndex + 1 < this.sortedByValue.length &&
            this.sortedByValue[currentIndex + 1].value < value) {
            this.sortedByValue[currentIndex] = this.sortedByValue[currentIndex + 1];
            this.reverseSortLookup[this.sortedByValue[currentIndex].ref] = currentIndex;
            currentIndex++;
        }
        this.sortedByValue[currentIndex] = {
            ref: ref,
            object: oldObject,
            value: value
        };
        this.reverseSortLookup[ref] = currentIndex;
        // Every boundary crossed must move down
        var index32AboveOldValue = Math.floor(oldValue / this.bucketSize) + 1;
        var index32New = Math.floor(value / this.bucketSize);
        for (var index32 = index32AboveOldValue; index32 < this.valueLookup32.length && index32 <= index32New; index32++) {
            this.valueLookup32[index32]--;
        }
    }
    private resortDownward(ref: int, value: number) {
        var currentIndex = this.reverseSortLookup[ref];
        var oldObject = this.sortedByValue[currentIndex].object;
        var oldValue = this.sortedByValue[currentIndex].value;
        while (currentIndex - 1 >= 0 &&
            this.sortedByValue[currentIndex - 1].value > value) {
            this.sortedByValue[currentIndex] = this.sortedByValue[currentIndex - 1];
            this.reverseSortLookup[this.sortedByValue[currentIndex].ref] = currentIndex;
            currentIndex--;
        }
        this.sortedByValue[currentIndex] = {
            ref: ref,
            object: oldObject,
            value: value
        };
        this.reverseSortLookup[ref] = currentIndex;
        // Every boundary crossed must move up
        var index32Old = Math.floor(oldValue / this.bucketSize);
        var index32AboveNew = Math.floor(value / this.bucketSize) + 1;
        for (var index32 = index32AboveNew; index32 < this.valueLookup32.length && index32 <= index32Old; index32++) {
            this.valueLookup32[index32]++;
        }
    }
    /**
     * @param {int} valueStart
     * @param {int} valueEndEx
     * @param {function(Object)} callback
     * @return {boolean}
     */
    forEachInRange(valueStart: int, valueEndEx: int, callback: (arg0: object) => void): boolean {
        // if(Math.floor(valueStart) !== valueStart) {
        //     console.warn("Non-integer value: " + valueStart);
        // }
        var index32 = Math.floor(valueStart / this.bucketSize);
        if (index32 >= this.valueLookup32.length) {
            index32 = this.valueLookup32.length - 1;
        }
        var iSorted = this.valueLookup32[index32];
        var iSortedEnd = index32 + 1 < this.valueLookup32.length
            ? this.valueLookup32[index32 + 1]
            : this.sortedByValue.length;
        var found = false;
        for (; iSorted < iSortedEnd; iSorted++) {
            var sortedItem = this.sortedByValue[iSorted];
            if (sortedItem.value >= valueStart &&
                sortedItem.value < valueEndEx) {
                // If the caller just wanted boolean, return early
                if (!callback) {
                    return true;
                }
                found = true;
                callback(sortedItem.object);
                // } else if(sortedItem.value > value) {
                //     // Will this optimization help?
                //     return found;
            }
        }
        return found;
    }
    /**
     *
     * @param {function(Object)} callback - function that will be called for each item in the sorted list
     * @return {boolean} found - true if there is something in the list
     */
    forEachInList(callback: (arg0: object) => void): boolean {
        var found = false;
        for (var iSorted = 0; iSorted < this.sortedByValue.length; iSorted++) {
            var sortedItem = this.sortedByValue[iSorted];
            // If the caller just wanted boolean, return early
            if (!callback) {
                return true;
            }
            found = true;
            callback(sortedItem.object);
        }
        return found;
    }
}
