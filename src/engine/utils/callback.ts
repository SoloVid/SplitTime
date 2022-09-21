import * as splitTime from "../splitTime";
export interface SimpleCallback<T> {
    callBack(param: T): void;
}
export function instanceOfSimpleCallback(thing: unknown): thing is splitTime.SimpleCallback<unknown> {
    const callback = thing as splitTime.SimpleCallback<unknown>;
    return !!thing && typeof callback.callBack === "function";
}
