export interface Runnable<T = void> {
    run(): T;
}
export function instanceOfRunnable(thing: unknown): thing is Runnable<unknown> {
    const runnable = thing as Runnable<unknown>;
    return !!thing && typeof runnable.run === "function";
}
