__deferredWaiting = false;
for(const callback of __deferredCalls) {
    callback();
}
