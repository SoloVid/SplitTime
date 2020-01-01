namespace SplitTime.Logger {
    export function debug(...args) {
        console.log.apply(null, arguments);
    }
    export function warn(...args) {
        console.warn.apply(null, arguments);
    }
    export function error(...args) {
        console.error.apply(null, arguments);
    }
}