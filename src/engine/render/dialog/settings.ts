namespace SplitTime.dialog {
    export const AdvanceMethod = {
        DEFAULT: "HYBRID",
        AUTO: "AUTO",
        INTERACTION: "INTERACTION",
        HYBRID: "HYBRID"
    };
    
    export const DASH = "\u2014";
    export const SPACE = " ";
    export const SHORT_BREAK_PUNCTUATION = [",", ";", ":", DASH];
    export const LONG_BREAK_PUNCTUATION = [".", "?", "!"];

    class Conversion {
        constructor(private readonly pattern: RegExp, private readonly replacement: string) {

        }

        apply(input: string): string {
            return input.replace(this.pattern, this.replacement);
        }
    }

    export let CONVERSIONS: Conversion[] = [
        new Conversion(/--/g, DASH)
    ];

    export let DEFAULT_MS_PER_CHAR = 40;
    export let EXTRA_MS_PER_SPACE = 0;
    export let EXTRA_MS_PER_SHORT_BREAK_PUNCTUATION = 8 * DEFAULT_MS_PER_CHAR;
    export let EXTRA_MS_PER_LONG_BREAK_PUNCTUATION = 16 * DEFAULT_MS_PER_CHAR;

    export let DEFAULT_DELAY_MS = 500;
}