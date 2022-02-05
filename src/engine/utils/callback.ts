namespace splitTime {
    export interface SimpleCallback<T> {
        callBack(param: T): void;
    }
}
namespace splitTime.instanceOf {
    export function SimpleCallback(thing: unknown): thing is SimpleCallback<unknown> {
        const callback = thing as SimpleCallback<unknown>
        return !!thing && typeof callback.callBack === "function"
    }
}
