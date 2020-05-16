namespace splitTime {
    export interface Callback<T> {
        callBack(param: T): void;
    }

    export namespace instanceOf {
        export function Callback(thing: unknown): thing is Callback<unknown> {
            const callback = thing as Callback<unknown>
            return !!thing && typeof callback.callBack === "function"
        }
    }
}