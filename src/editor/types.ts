// I couldn't figure out how to import Vue's types
declare class Vue {
    constructor(object: object)
    static component(name: string, options: object): void
    static set(object: object, key: string, value: unknown): void
}
// declare namespace Vue {
//     export function component(name: string, options: object): void
//     export function set(object: object, key: string, value: unknown): void
// }
