dependsOn("IntervalStabilizer.js");

SplitTime.FrameStabilizer = SplitTime.IntervalStabilizer.makeClass(function() {
    return new Date();
});
