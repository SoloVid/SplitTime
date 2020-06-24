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

    /**
     * random integer between 1 and num
     */
    export function randomInt(num: number) {
        return Math.floor(Math.random() * num + 1)
    }

    /**
     * random integer between 1 and num
     */
    export function randomRangedInt(min: number, max: number) {
        return Math.round(Math.random() * (max - min)) + min
    }

    /**
     * random integer between 1 and num
     */
    export function randomRanged(min: number, max: number) {
        return Math.random() * (max - min) + min
    }

    export function randomSeed() {
        var limit = new Date().getTime() % 1000000
        for (var i = 0; i < limit; i++) {
            Math.random()
        }
    }

    export function approachValue(
        oldValue: number,
        targetValue: number,
        step: number
    ) {
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
        let nStr = n + '';
        return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join(padChar) + nStr;
      }

    export function isOverlap(x1: number, length1: number, x2: number, length2: number) {
        var noOverlap =
            x1 + length1 <= x2 ||
            x2 + length2 <= x1
        return !noOverlap
    }
}
