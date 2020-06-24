namespace splitTime.level {
    /**
     * @param {int} value
     * @param {function(splitTime.Body)} callback
     * @param {BodiesSortedByOneValue} bodiesSortHolder
     * @return {boolean}
     */
    function forEachBodyAtValue(
        value: int,
        callback: (arg0: splitTime.Body) => void,
        bodiesSortHolder: BodiesSortedByOneValue | null
    ): boolean {
        if (bodiesSortHolder === null) {
            console.warn("Attempting to use BodyOrganizer before initialized")
            return false
        }
        if (Math.floor(value) !== value) {
            console.warn("Non-integer value: " + value)
        }

        var index32 = Math.floor(value / 32)
        if (index32 >= bodiesSortHolder.valueLookup32.length) {
            index32 = bodiesSortHolder.valueLookup32.length - 1
        }
        var iSorted = bodiesSortHolder.valueLookup32[index32]
        var iSortedEnd =
            index32 + 1 < bodiesSortHolder.valueLookup32.length
                ? bodiesSortHolder.valueLookup32[index32 + 1]
                : bodiesSortHolder.sortedByValue.length
        var foundBody = false
        for (; iSorted < iSortedEnd; iSorted++) {
            var sortedItem = bodiesSortHolder.sortedByValue[iSorted]
            if (sortedItem.value === value) {
                // If the caller just wanted boolean, return early
                if (!callback) {
                    return true
                }
                foundBody = true
                callback(sortedItem.body as Body)
                // } else if(sortedItem.value > value) {
                //     // Will this optimization help?
                //     return foundBody;
            }
        }
        return foundBody
    }

    var BUFFER = 10000

    export class BodyOrganizer {
        _initialized: boolean
        _bodies: Body[]
        _bodySet: { [ref: number]: boolean }
        _sortedByXLeft: BodiesSortedByOneValue | null = null
        _sortedByXRight: BodiesSortedByOneValue | null = null
        _sortedByYTop: BodiesSortedByOneValue | null = null
        _sortedByYBottom: BodiesSortedByOneValue | null = null
        _sortedByZTop: BodiesSortedByOneValue | null = null
        _sortedByZBottom: BodiesSortedByOneValue | null = null
        /**
         * A class for arranging bodies for collisions
         * @param {splitTime.Level} [level]
         * @constructor
         * @alias splitTime.Level.BodyOrganizer
         */
        constructor(level: splitTime.Level) {
            this._initialized = false
            /** @type {splitTime.Body[]} */
            this._bodies = []
            this._bodySet = {}

            if (level) {
                this.initialize(level)
            }
        }

        /**
         * @param {splitTime.Level} level
         */
        initialize(level: splitTime.Level) {
            var maxX32 = Math.ceil(level.width / 32)
            var maxY32 = Math.ceil(level.yWidth / 32)
            var maxZ32 = Math.ceil(level.highestLayerZ / 32)
            this._sortedByXLeft = new BodiesSortedByOneValue(maxX32)
            this._sortedByXRight = new BodiesSortedByOneValue(maxX32)
            this._sortedByYTop = new BodiesSortedByOneValue(maxY32)
            this._sortedByYBottom = new BodiesSortedByOneValue(maxY32)
            this._sortedByZTop = new BodiesSortedByOneValue(maxZ32)
            this._sortedByZBottom = new BodiesSortedByOneValue(maxZ32)

            this._initialized = true
            for (var i = 0; i < this._bodies.length; i++) {
                this.addBody(this._bodies[i])
            }
        }

        /**
         * @return {splitTime.Body[]}
         */
        getBodies(): splitTime.Body[] {
            return this._bodies
        }

        /**
         * Register a body with the organizer (such as on level entrance)
         * @param {splitTime.Body} body
         */
        addBody(body: splitTime.Body) {
            if (this._bodySet[body.ref]) {
                return
            }
            this._bodies.push(body)
            this._bodySet[body.ref] = true

            if (!this._initialized) {
                return
            }

            this._sortedByXLeft!.addBody(body)
            this._sortedByXRight!.addBody(body)
            this._sortedByYTop!.addBody(body)
            this._sortedByYBottom!.addBody(body)
            this._sortedByZTop!.addBody(body)
            this._sortedByZBottom!.addBody(body)

            this.resort(body)
        }

        /**
         * Deregister a body from the organizer (such as on level exit)
         * @param {splitTime.Body} body
         */
        removeBody(body: splitTime.Body) {
            for (var i = this._bodies.length - 1; i >= 0; i++) {
                this._bodies.splice(i, 1)
            }
            this._bodySet[body.ref] = false

            if (!this._initialized) {
                return
            }

            this._sortedByXLeft!.removeBody(body)
            this._sortedByXRight!.removeBody(body)
            this._sortedByYTop!.removeBody(body)
            this._sortedByYBottom!.removeBody(body)
            this._sortedByZTop!.removeBody(body)
            this._sortedByZBottom!.removeBody(body)
        }

        /**
         * Force the organizer to resort the body in question.
         * This method assumes all other bodies in the organizer are already sorted.
         * Should be called every time coordinates of body change.
         * @param {splitTime.Body} body
         */
        resort(body: splitTime.Body) {
            if (!this._initialized) {
                return
            }

            var halfBaseLength = Math.round(body.baseLength / 2)
            var roundHeight = Math.round(body.height)
            var roundX = Math.floor(body.getX())
            var roundY = Math.floor(body.getY())
            var roundZ = Math.floor(body.getZ())

            this._sortedByXLeft!.resortBody(body, roundX - halfBaseLength)
            this._sortedByXRight!.resortBody(body, roundX + halfBaseLength)
            this._sortedByYTop!.resortBody(body, roundY - halfBaseLength)
            this._sortedByYBottom!.resortBody(body, roundY + halfBaseLength)
            this._sortedByZTop!.resortBody(body, roundZ + roundHeight)
            this._sortedByZBottom!.resortBody(body, roundZ)
        }

        /**
         * Check if bodies are present with left at specified x.
         * If so, run callback for each one.
         * @return whether bodies were found
         */
        forEachXLeft(x: int, callback: (body: splitTime.Body) => void): boolean {
            return forEachBodyAtValue(x, callback, this._sortedByXLeft)
        }

        forEachXRight(x: int, callback: (body: splitTime.Body) => void) {
            return forEachBodyAtValue(x, callback, this._sortedByXRight)
        }

        forEachYTop(y: int, callback: (body: splitTime.Body) => void) {
            return forEachBodyAtValue(y, callback, this._sortedByYTop)
        }

        forEachYBottom(y: int, callback: (body: splitTime.Body) => void) {
            return forEachBodyAtValue(y, callback, this._sortedByYBottom)
        }

        forEachZTop(z: int, callback: (body: splitTime.Body) => void) {
            return forEachBodyAtValue(z, callback, this._sortedByZTop)
        }

        forEachZBottom(z: int, callback: (body: splitTime.Body) => void) {
            return forEachBodyAtValue(z, callback, this._sortedByZBottom)
        }
    }

    class BodiesSortedByOneValue {
        max32Value: number
        valueLookup32: number[]
        sortedByValue: { value: number; body: Body | { ref: int } }[]
        reverseSortLookup: number[]

        constructor(max32Value: number) {
            this.max32Value = max32Value
            this.valueLookup32 = new Array(max32Value)
            for (var i = 0; i < this.valueLookup32.length; i++) {
                this.valueLookup32[i] = 1
            }
            var minSentinel = {
                value: -BUFFER,
                body: { ref: 0 }
            }
            var maxSentinel = {
                value: this._getBeyondMaxValue(),
                body: { ref: 1 }
            }
            this.sortedByValue = [minSentinel, maxSentinel]
            this.reverseSortLookup = [0, 1]
        }

        _getBeyondMaxValue() {
            return this.max32Value * 32 + BUFFER
        }

        addBody(body: Body) {
            this.sortedByValue.push({
                value: this._getBeyondMaxValue(),
                body: body
            })
            this.reverseSortLookup[body.ref] = this.sortedByValue.length - 1
        }

        removeBody(body: Body) {
            this.resortBody(body, this._getBeyondMaxValue())
            this.sortedByValue.splice(this.reverseSortLookup[body.ref], 1)
            delete this.reverseSortLookup[body.ref]
        }

        resortBody(body: Body, value: number) {
            if (Math.floor(value) !== value) {
                console.warn("Non-integer value: " + value)
            }

            var currentIndex = this.reverseSortLookup[body.ref]
            var oldValue = this.sortedByValue[currentIndex].value
            if (value === oldValue) {
                return
            }
            if (value > oldValue) {
                this.resortBodyUpward(body, value)
            } else if (value < oldValue) {
                this.resortBodyDownward(body, value)
            }
        }

        resortBodyUpward(body: Body, value: number) {
            var currentIndex = this.reverseSortLookup[body.ref]
            var oldValue = this.sortedByValue[currentIndex].value

            while (
                currentIndex + 1 < this.sortedByValue.length &&
                this.sortedByValue[currentIndex + 1].value < value
            ) {
                this.sortedByValue[currentIndex] = this.sortedByValue[
                    currentIndex + 1
                ]
                this.reverseSortLookup[
                    this.sortedByValue[currentIndex].body.ref
                ] = currentIndex
                currentIndex++
            }
            this.sortedByValue[currentIndex] = {
                body: body,
                value: value
            }
            this.reverseSortLookup[body.ref] = currentIndex

            // Every boundary crossed must move down
            var index32AboveOldValue = Math.floor(oldValue / 32) + 1
            var index32New = Math.floor(value / 32)
            for (
                var index32 = index32AboveOldValue;
                index32 < this.valueLookup32.length && index32 <= index32New;
                index32++
            ) {
                this.valueLookup32[index32]--
            }
        }

        resortBodyDownward(body: Body, value: number) {
            var currentIndex = this.reverseSortLookup[body.ref]
            var oldValue = this.sortedByValue[currentIndex].value

            while (
                currentIndex - 1 >= 0 &&
                this.sortedByValue[currentIndex - 1].value > value
            ) {
                this.sortedByValue[currentIndex] = this.sortedByValue[
                    currentIndex - 1
                ]
                this.reverseSortLookup[
                    this.sortedByValue[currentIndex].body.ref
                ] = currentIndex
                currentIndex--
            }
            this.sortedByValue[currentIndex] = {
                body: body,
                value: value
            }
            this.reverseSortLookup[body.ref] = currentIndex

            // Every boundary crossed must move up
            var index32Old = Math.floor(oldValue / 32)
            var index32AboveNew = Math.floor(value / 32) + 1
            for (
                var index32 = index32AboveNew;
                index32 < this.valueLookup32.length && index32 <= index32Old;
                index32++
            ) {
                this.valueLookup32[index32]++
            }
        }
    }
}
