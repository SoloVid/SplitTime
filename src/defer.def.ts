var __deferredCalls: (() => void)[] = []
var __deferredWaiting = true

/**
 * Wait until all code is loaded (i.e. run) before running this callback.
 * Recommended to use a lambda.
 * @param callback to be run after all code has been loaded
 */
function defer(callback: () => void): void
/**
 * Ensure that we aren't in a deferred state.
 * That is, throw an exception if the user tries to execute this
 * but we haven't reached the resolution stage for deferreds.
 */
function defer(): void | never
function defer(callback?: () => void): void {
    if (!callback) {
        if (DEBUG) {
            if (__deferredWaiting) {
                throw new Error(
                    "Code not intended to be called before deferred resolution"
                )
            }
        }
    } else {
        __deferredCalls.push(callback)
    }
}
