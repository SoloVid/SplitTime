namespace splitTime.type {
    type TypeChecker<T> = (thing: unknown) => thing is T
    export function isA<T>(thing: unknown, checker: TypeChecker<T>): thing is T {
        return checker(thing)
    }

    // NoInfer<T> idea from rom https://stackoverflow.com/a/56688073/4639640
    type NoInfer<T> = [T][T extends unknown ? 0 : never]
    export function other<T = never>(callback: NoInfer<T> extends never ? never : (thing: unknown) => boolean): TypeChecker<NoInfer<T>> {
        return function(thing: unknown): thing is T {
            return callback(thing)
        }
    }

    export const string = other<string>(thing => typeof thing === "string")
    export const number = other<number>(thing => typeof thing === "number")
    export const int = other<int>(thing => typeof thing === "number" && Number.isInteger(thing))
    export const boolean = other<boolean>(thing => typeof thing === "boolean")

    type NotArray<T> = T extends unknown[] ? never : T
    type ObjectDefinition<T> = { [K in keyof T]: TypeChecker<T[K]> }
    export function object<T extends object>(definition: ObjectDefinition<NotArray<T>>): TypeChecker<T> {
        return function(thing: unknown): thing is T {
            if (typeof thing !== "object") {
                return false
            }
            if (thing === null) {
                return false
            }
            const keysAllowed: string[] = []
            for (const key in definition) {
                keysAllowed.push(key)
                if (!(key in thing)) {
                    return false
                }
                // FTODO: This is type unsafe
                if (!isA(thing, definition[key])) {
                    return false
                }
            }
            for (const key in thing) {
                if (keysAllowed.indexOf(key) < 0) {
                    return false
                }
            }
            return true
        }
    }

    type ArrayItemType<T> = T extends (infer U)[] ? U : never
    type ArrayDefinition<T> = TypeChecker<ArrayItemType<T>>
    export function array<T extends unknown[]>(checker: ArrayDefinition<T>): TypeChecker<T> {
        return function(thing: unknown): thing is T {
            if (!Array.isArray(thing)) {
                return false
            }
            for (const item of thing) {
                if (!isA<ArrayItemType<T>>(item, checker)) {
                    return false
                }
            }
            return true
        }
    }
}