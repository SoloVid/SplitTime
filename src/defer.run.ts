import { __deferred } from "./splitTime";
__deferred.waiting = false;
for (const callback of __deferred.calls) {
    callback();
}
