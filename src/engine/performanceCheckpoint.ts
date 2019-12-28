var lastPerformanceCheck = null;

SplitTime.performanceCheckpoint = function(debugName, allow) {
    if(!allow) {
        allow = 5;
    }

    if(SplitTime.Debug.ENABLED) {
        var now = new Date();
        if(lastPerformanceCheck) {
            var timePassed = now.getMilliseconds() - lastPerformanceCheck.getMilliseconds();
            if(timePassed > allow) {
                SplitTime.Logger.warn(debugName + ": " + timePassed + "ms taken when " + allow + "ms allotted");
            }
        }
    }
};
