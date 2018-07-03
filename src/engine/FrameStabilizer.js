// TODO: maybe share code (static variables) to optimize?
SplitTime.FrameStabilizer = function(msPerFrame, maxCounter) {
    this.msPerFrame = msPerFrame;
    this.maxCounter = maxCounter || 1;
    this._counter = 0;
    this._counterSetAt = new Date();
    this._isClockFrame = true;
};

(function() {
    var cache = {};

    var previousFrameTime = new Date();
    var recentFrameTime = new Date();
    var timeElapsedSinceLastFrame = recentFrameTime - previousFrameTime;

    SplitTime.FrameStabilizer.getSimpleClock = function(msPerFrame) {
        if(!cache[msPerFrame]) {
            cache[msPerFrame] = new SplitTime.FrameStabilizer(msPerFrame);
        }
        return cache[msPerFrame];
    };

    SplitTime.FrameStabilizer.notifyFrameUpdate = function() {
        previousFrameTime = recentFrameTime;
        recentFrameTime = new Date();
        timeElapsedSinceLastFrame = recentFrameTime - previousFrameTime;
    };

    SplitTime.FrameStabilizer.prototype.getCounter = function() {
        if(this._counterSetAt < recentFrameTime) {
            this._counter += timeElapsedSinceLastFrame / this.msPerFrame;
            this._isClockFrame = this.counter >= this.maxCounter;
            this._counter %= this.maxCounter;
        }
        return Math.round(this._counter);
    };

    SplitTime.FrameStabilizer.prototype.isClockFrame = function() {
        return this._isClockFrame;
    }
} ());