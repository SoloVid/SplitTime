namespace SplitTime.Logger {
    export const debug = console.log.bind(window.console);
    export const warn = console.warn.bind(window.console);
    export const error = console.error.bind(window.console);
}