var __deferredCalls: (() => void)[] = [];

/**
 * Wait until all code is loaded (i.e. run) before running this callback.
 * Recommended to use a lambda.
 * @param callback to be run after all code has been loaded
 */
function defer(callback: () => void) {
    __deferredCalls.push(callback);
}
