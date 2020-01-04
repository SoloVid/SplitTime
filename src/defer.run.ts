for(const callback of __deferredCalls) {
    callback();
}
// Clear callbacks so we can re-use this script for another batch
__deferredCalls = [];