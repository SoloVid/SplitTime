import { Brand } from "ts-brand";

// Note: TypeScript can't enforce integers; so tread with caution
export type int = number;
export function assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}
export function assertNever(impossible: never, message: string): never {
    throw new Error(message);
}

/**
 * Percentage value (e.g. `100` is 100%)
 */
export type Percent = Brand<number, "percent">

/**
 * Fractional value, typically focused around 1 (e.g. 0.5, 2)
 */
export type Fraction = Brand<number, "fraction">
