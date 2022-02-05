import * as splitTime from "../splitTime";
export interface Runnable<T = void> {
    run(): T;
}
export function instanceOfRunnable(thing: unknown): thing is splitTime.Runnable<unknown> {
    const runnable = thing as splitTime.Runnable<unknown>;
    return !!thing && typeof runnable.run === "function";
}
