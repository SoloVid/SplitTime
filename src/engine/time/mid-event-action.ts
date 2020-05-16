namespace splitTime.time {
    type CallbackReturn = void | ObjectCallbacks<void>
    export type MidEventCallback = Instable<Runnable<CallbackReturn>> | Runnable<CallbackReturn> | (() => CallbackReturn)

    export class MidEventAction implements Runnable<CallbackReturn> {
        constructor(
            private readonly callback: MidEventCallback
        ) {}

        run(): CallbackReturn {
            if (instanceOf.Instable(this.callback)) {
                return this.callback.inst().run()
            }
            if (instanceOf.Runnable(this.callback)) {
                return this.callback.run()
            }

            return this.callback()
        }
    }
}
