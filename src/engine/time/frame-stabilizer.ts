import { IntervalStabilizer } from "../splitTime";
export class FrameStabilizer implements Signaler {
    _internalStabilizer: IntervalStabilizer;
    constructor(msPerFrame: number, maxCounter: number = 1) {
        this._internalStabilizer = new IntervalStabilizer(msPerFrame, maxCounter, function () {
            return performance.now();
        });
    }
    isSignaling() {
        return this._internalStabilizer.isSignaling();
    }
}
