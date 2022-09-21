export function saferPow(base: number, exponent: number): number {
    return base < 0 ? -Math.pow(-base, exponent) : Math.pow(base, exponent);
}
