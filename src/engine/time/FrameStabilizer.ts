namespace SplitTime {
    export class FrameStabilizer implements Signaler {
        _internalStabilizer: SplitTime.IntervalStabilizer;
        
        constructor(msPerFrame, maxCounter = 1) {
            this._internalStabilizer = new SplitTime.IntervalStabilizer(msPerFrame || SplitTime.msPerFrame, maxCounter, function() {
                return new Date();
            });
        };
        isSignaling() {
            return this._internalStabilizer.isSignaling();
        };
    }
}