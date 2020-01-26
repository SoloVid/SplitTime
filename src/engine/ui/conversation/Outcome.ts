namespace SplitTime.conversation {
    export class Outcome {
        constructor(private _canceled = false, private _interrupted = false) {

        }

        get canceled(): boolean {
            return this._canceled;
        }
        get interrupted(): boolean {
            return this._interrupted;
        }
    }
}