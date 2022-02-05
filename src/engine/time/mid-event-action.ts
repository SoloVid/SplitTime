import { ObjectCallbacks, Instable, Runnable, instanceOfInstable, instanceOfRunnable } from "../splitTime";
type CallbackReturn = void | ObjectCallbacks<void>;
export type MidEventCallback = Instable<Runnable<CallbackReturn>> | Runnable<CallbackReturn> | (() => CallbackReturn);
export class MidEventAction implements Runnable<CallbackReturn> {
    constructor(private readonly callback: MidEventCallback) { }
    run(): CallbackReturn {
        if (instanceOfInstable(this.callback)) {
            return this.callback.inst().run();
        }
        if (instanceOfRunnable(this.callback)) {
            return this.callback.run();
        }
        return this.callback();
    }
}
