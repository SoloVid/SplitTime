namespace splitTime.conversation {
    export enum AdvanceMethod {
        DEFAULT = "HYBRID",
        AUTO = "AUTO",
        INTERACTION = "INTERACTION",
        HYBRID = "HYBRID"
    }

    export const DASH = "\u2014"
    export const SPACE = " "
    export const SHORT_BREAK_PUNCTUATION = [",", ";", ":", DASH]
    export const LONG_BREAK_PUNCTUATION = [".", "?", "!"]

    class Conversion {
        constructor(
            private readonly pattern: RegExp,
            private readonly replacement: string
        ) {}

        apply(input: string): string {
            return input.replace(this.pattern, this.replacement)
        }
    }

    export let CONVERSIONS: Conversion[] = [new Conversion(/--/g, DASH)]

    export let DEFAULT_MS_PER_CHAR = 40
    export let FACTOR_PER_SPACE = 0
    export let FACTOR_PER_SHORT_BREAK_PUNCTUATION = 8
    export let FACTOR_PER_LONG_BREAK_PUNCTUATION = 16
    export let FACTOR_END_OF_LINE = 24

    export function howLongForChar(char: string, msPerChar: int): number {
        if (char === SPACE) {
            return msPerChar * FACTOR_PER_SPACE
        } else if (SHORT_BREAK_PUNCTUATION.indexOf(char) >= 0) {
            return msPerChar * FACTOR_PER_SHORT_BREAK_PUNCTUATION
        } else if (LONG_BREAK_PUNCTUATION.indexOf(char) >= 0) {
            return msPerChar * FACTOR_PER_LONG_BREAK_PUNCTUATION
        }
        return msPerChar
    }
}
