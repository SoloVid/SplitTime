namespace splitTime {
    // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
    export const MAX_SAFE_INTEGER = 9007199254740991

    let SCRIPT_DIRECTORY = "<UNKNOWN>"
    if(__DOM__) {
        // from https://stackoverflow.com/a/2161748/4639640
        var scripts = document.getElementsByTagName("script")
        var path = scripts[scripts.length - 1].src.split("?")[0] // remove ?query
        SCRIPT_DIRECTORY = path
            .split("/")
            .slice(0, -1)
            .join("/") // remove last filename part of path
    } else if(__NODE__) {
        SCRIPT_DIRECTORY = __dirname
    }

    export function getScriptDirectory(): string {
        return SCRIPT_DIRECTORY
    }

    // Implementation from https://stackoverflow.com/a/1349426/4639640
    export function generateUID(length: int = 16) {
        var result           = ''
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        var charactersLength = characters.length
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
     }

    export function approachValue(
        oldValue: number,
        targetValue: number,
        step: number
    ) {
        assert(step > 0, "step should be positive")
        if (oldValue < targetValue) {
            return Math.min(oldValue + step, targetValue)
        } else {
            return Math.max(oldValue - step, targetValue)
        }
    }

    export function constrain(num: number, min: number, max: number) {
        return Math.max(min, Math.min(num, max))
    }

    export function mod(n: number, base: number) {
        return ((n % base) + base) % base
    }

    // From https://stackoverflow.com/a/10073788/4639640
    export function pad(n: number, width: int, padChar: string = "0") {
        let nStr = n + ''
        return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join(padChar) + nStr
    }

    // From https://stackoverflow.com/a/18650828/4639640
    export function formatBytes(bytes: number, decimals = 2): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    export function isOverlap(x1: number, length1: number, x2: number, length2: number) {
        var noOverlap =
            x1 + length1 <= x2 ||
            x2 + length2 <= x1
        return !noOverlap
    }
}
