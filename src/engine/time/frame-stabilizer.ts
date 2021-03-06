namespace splitTime {
    export class FrameStabilizer implements Signaler {
        _internalStabilizer: splitTime.IntervalStabilizer

        constructor(msPerFrame: number, maxCounter: number = 1) {
            this._internalStabilizer = new splitTime.IntervalStabilizer(
                msPerFrame,
                maxCounter,
                function() {
                    return performance.now()
                }
            )
        }
        isSignaling() {
            return this._internalStabilizer.isSignaling()
        }
    }
}
