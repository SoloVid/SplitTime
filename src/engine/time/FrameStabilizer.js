dependsOn("IntervalStabilizer.js");

/**
 * @implements Signaler
 */
SplitTime.FrameStabilizer = function(msPerFrame, maxCounter) {
    this._internalStabilizer = new SplitTime.IntervalStabilizer(msPerFrame || SplitTime.msPerFrame, maxCounter || 1, function() {
        return new Date();
    });
};
SplitTime.FrameStabilizer.prototype.isSignaling = function() {
    return this._internalStabilizer.isSignaling();
};
