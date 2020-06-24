namespace splitTime {
    export interface Runnable<T = void> {
        run(): T
    }

    export namespace instanceOf {
        export function Runnable(thing: unknown): thing is Runnable<unknown> {
            const runnable = thing as Runnable<unknown>
            return !!thing && typeof runnable.run === "function"
        }
    }
}