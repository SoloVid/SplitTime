namespace SplitTime {
    export class FrameStabilizer implements Signaler {
        _internalStabilizer: SplitTime.IntervalStabilizer

        constructor(msPerFrame: number, maxCounter: number = 1) {
            this._internalStabilizer = new SplitTime.IntervalStabilizer(
                msPerFrame,
                maxCounter,
                function() {
                    return new Date().getTime()
                }
            )
        }
        isSignaling() {
            return this._internalStabilizer.isSignaling()
        }
    }
}
