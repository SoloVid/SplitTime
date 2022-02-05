import { DEBUG } from "./splitTime";
export const __deferred = {
    calls: [] as (() => void)[],
    waiting: true
};
/**
 * Wait until all code is loaded (i.e. run) before running this callback.
 * Recommended to use a lambda.
 * @param callback to be run after all code has been loaded
 *
 * Note: This function should not be called from engine code
 * because the engine should not have runtime code or globals.
 */
export function defer(callback: () => void): void;
/**
 * Ensure that we aren't in a deferred state.
 * That is, throw an exception if the user tries to execute this
 * but we haven't reached the resolution stage for deferreds.
 */
export function defer(): void | never;
export function defer(callback?: () => void): void {
    if (!callback) {
        if (DEBUG) {
            if (__deferred.waiting) {
                throw new Error("Code not intended to be called before deferred resolution");
            }
        }
    }
    else {
        __deferred.calls.push(callback);
    }
}
