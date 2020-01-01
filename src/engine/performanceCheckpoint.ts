namespace SplitTime {
var lastPerformanceCheck = null;

export function performanceCheckpoint(debugName, allow = 5) {
    if(SplitTime.debug.ENABLED) {
        var now = new Date();
        if(lastPerformanceCheck) {
            var timePassed = now.getMilliseconds() - lastPerformanceCheck.getMilliseconds();
            if(timePassed > allow) {
                SplitTime.Logger.warn(debugName + ": " + timePassed + "ms taken when " + allow + "ms allotted");
            }
        }
    }
};
}