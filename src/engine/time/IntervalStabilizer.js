(function() {
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
            this._counter = 0;
            this._counterSetAt = currentTimeGetter();
            this._isClockFrame = true;
        };

        var cache = {};

        var previousFrameTime = currentTimeGetter();
        var recentFrameTime = currentTimeGetter();
        var timeElapsedSinceLastFrame = recentFrameTime - previousFrameTime;

        Stabilizer.getSimpleClock = function(msPerFrame) {
            if(!cache[msPerFrame]) {
                cache[msPerFrame] = new Stabilizer(msPerFrame);
            }
            return cache[msPerFrame];
        };

        Stabilizer.haveSoManyMsPassed = function(milliseconds) {
            return Stabilizer.getSimpleClock(milliseconds).isSignaling();
        };

        Stabilizer.notifyFrameUpdate = function() {
            previousFrameTime = recentFrameTime;
            recentFrameTime = currentTimeGetter();
            timeElapsedSinceLastFrame = recentFrameTime - previousFrameTime;
        };

        Stabilizer.prototype.checkUpdate = function() {
            if(this._counterSetAt < recentFrameTime) {
                this._counter += (recentFrameTime - this._counterSetAt) / this.msPerFrame;
                this._isClockFrame = this._counter >= this.maxCounter;
                this._counter %= this.maxCounter;
                this._counterSetAt = recentFrameTime;
            }
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
} ());