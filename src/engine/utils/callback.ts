export interface SimpleCallback<T> {
    callBack(param: T): void;
}
export function instanceOfSimpleCallback(thing: unknown): thing is SimpleCallback<unknown> {
    const callback = thing as SimpleCallback<unknown>;
    return !!thing && typeof callback.callBack === "function";
}
