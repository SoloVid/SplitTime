/**
 * @implements Signaler
 */
SplitTime.IntervalStabilizer = function(msPerFrame, maxCounter, currentTimeGetter) {
    this.msPerFrame = msPerFrame || 100;
    this.maxCounter = maxCounter || 1;
    this.currentTimeGetter = currentTimeGetter;
    this.reset();
};

SplitTime.IntervalStabilizer.prototype.howManyMsSinceLastFrame = function() {
    this.checkUpdate();
    return this._counterSetAt - this._previousCounterSetAt;
};

SplitTime.IntervalStabilizer.prototype.reset = function() {
    this._counter = 0;
    this._counterSetAt = this.currentTimeGetter();
    this._isClockFrame = true;
};

SplitTime.IntervalStabilizer.prototype.checkUpdate = function() {
    var newTime = this.currentTimeGetter();
    if(this._counterSetAt < newTime) {
        this._counter += (newTime - this._counterSetAt) / this.msPerFrame;
        this._isClockFrame = this._counter >= this.maxCounter;
        this._counter %= this.maxCounter;
        this._previousCounterSetAt = this._counterSetAt;
        this._counterSetAt = newTime;
    } else {
        this._isClockFrame = false;
    }
};

SplitTime.IntervalStabilizer.prototype.howManyMsSinceLastTick = function() {
    this.checkUpdate();
    return this._counterSetAt - this._previousCounterSetAt;
};

SplitTime.IntervalStabilizer.prototype.getUnroundedCounter = function() {
    this.checkUpdate();
    return this._counter;
};

SplitTime.IntervalStabilizer.prototype.getCounter = function() {
    this.checkUpdate();
    return Math.round(this._counter);
};

SplitTime.IntervalStabilizer.prototype.isSignaling = function() {
    this.checkUpdate();
    return this._isClockFrame;
};
