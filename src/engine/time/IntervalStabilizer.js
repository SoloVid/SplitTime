SplitTime.IntervalStabilizer = {};

SplitTime.IntervalStabilizer.makeRegionStabilizerClass = function(region) {
    var time = region.getTime();
    return SplitTime.IntervalStabilizer.makeClass(function() {
        return time.getTimeMs();
    });
};

SplitTime.IntervalStabilizer.makeClass = function(currentTimeGetter) {
    var Stabilizer = function(msPerFrame, maxCounter) {
        this.msPerFrame = msPerFrame;
        this.maxCounter = maxCounter || 1;
        this.reset();
    };

    var cache = {};

    var previousFrameTime = currentTimeGetter();
    var ticksSameTime = 0;
    var recentFrameTime = currentTimeGetter();

    Stabilizer.getSimpleClock = function(msPerFrame) {
        if(!cache[msPerFrame]) {
            cache[msPerFrame] = new Stabilizer(msPerFrame);
        }
        return cache[msPerFrame];
    };

    Stabilizer.howManyMsSinceLastFrame = function() {
        return recentFrameTime - previousFrameTime;
    };

    Stabilizer.haveSoManyMsPassed = function(milliseconds) {
        return Stabilizer.getSimpleClock(milliseconds).isSignaling();
    };

    Stabilizer.notifyFrameUpdate = function() {
        previousFrameTime = recentFrameTime;
        recentFrameTime = currentTimeGetter();
        var timeElapsedSinceLastFrame = recentFrameTime - previousFrameTime;
        if(timeElapsedSinceLastFrame <= 0) {
            ticksSameTime++;
        } else {
            ticksSameTime = 0;
        }
    };

    Stabilizer.prototype.reset = function() {
        this._counter = 0;
        this._counterSetAt = currentTimeGetter();
        this._isClockFrame = true;
    };

    Stabilizer.prototype.checkUpdate = function() {
        if(this._counterSetAt < recentFrameTime) {
            this._counter += (recentFrameTime - this._counterSetAt) / this.msPerFrame;
            this._isClockFrame = this._counter >= this.maxCounter;
            this._counter %= this.maxCounter;
            this._previousCounterSetAt = this._counterSetAt;
            this._counterSetAt = recentFrameTime;
        } else if(ticksSameTime > 0) {
            this._isClockFrame = false;
        }
    };

    Stabilizer.prototype.howManyMsSinceLastTick = function() {
        this.checkUpdate();
        return this._counterSetAt - this._previousCounterSetAt;
    };

    Stabilizer.prototype.getUnroundedCounter = function() {
        this.checkUpdate();
        return this._counter;
    };

    Stabilizer.prototype.getCounter = function() {
        this.checkUpdate();
        return Math.round(this._counter);
    };

    Stabilizer.prototype.isSignaling = function() {
        this.checkUpdate();
        return this._isClockFrame;
    };

    return Stabilizer;
};
