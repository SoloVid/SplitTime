dependsOn("IntervalStabilizer.js");

/**
 * @implements Signaler
 */
SplitTime.FrameStabilizer = SplitTime.IntervalStabilizer.makeClass(function() {
    return new Date();
});
