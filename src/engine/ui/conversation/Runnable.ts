namespace SplitTime.conversation {
    export interface Runnable {
        run(): PromiseLike<outcome_t>
    }

    export class SimpleRunnable implements Runnable {
        constructor(private readonly callback: () => void) {}

        run(): PromiseLike<outcome_t> {
            this.callback()
            return Promise.resolve({
                canceled: false,
                interrupted: false
            })
        }
    }
}
