type NotFunction<T> = ((...args: any) => any) extends T ? never : T;
type Redirected<T> = () => Indirect<T>;
/**
 * A value that can be static or dynamic.
 * In other words, it may be specified either as the type directly
 * or as a lambda that returns the type when called.
 * Holders of an Indirect value should be expected to call
 * {@link redirect()} to obtain up-to-date concrete value of Indirect value
 * prior to any use.
 */
export type Indirect<T> = NotFunction<T> | Redirected<T>;
/**
 * Obtain the current concrete value of an Indirect value.
 */
export function redirect<T>(thing: Indirect<T>): T {
    if (typeof thing === "function") {
        const getter = thing as Redirected<T>;
        return redirect(getter());
    }
    return thing;
}
