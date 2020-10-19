namespace splitTime.type {
    type TypeChecker<T> = (thing: unknown) => thing is T
    export function isA<T>(thing: unknown, checker: TypeChecker<T>): thing is T {
        return checker(thing)
    }

    // NoInfer<T> idea from rom https://stackoverflow.com/a/56688073/4639640
    type NoInfer<T> = [T][T extends unknown ? 0 : never]
    type IfNotNever<T, U> = T extends never ? never : U
    export function other<T = never>(callback: IfNotNever<NoInfer<T>, (thing: unknown) => boolean>): TypeChecker<NoInfer<T>> {
        return function(thing: unknown): thing is T {
            return callback(thing)
        }
    }

    export const string = other<string>(thing => typeof thing === "string")
    export const number = other<number>(thing => typeof thing === "number")
    export const int = other<int>(thing => typeof thing === "number" && Number.isInteger(thing))
    export const boolean = other<boolean>(thing => typeof thing === "boolean")

    type NotArray<T> = T extends unknown[] ? never : T
    type ObjectTypeDefinition<T> = { [K in keyof T]: TypeChecker<T[K]> }
    export function object<T extends object>(definition: ObjectTypeDefinition<NotArray<T>>): TypeChecker<T> {
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
                const checker = definition[key]
                // FTODO: This is technically type unsafe as far as the type assertion goes
                // because the for loop keeps us from precisely knowing what the type of definition[key] is.
                // However, if the static type checking on this "object" function signature
                // is correct, there shouldn't be a run-time problem.
                if (!isA(thing, checker)) {
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
    type ArrayTypeDefinition<T> = TypeChecker<ArrayItemType<T>>
    export function array<T extends unknown[]>(checker: ArrayTypeDefinition<T>): TypeChecker<T> {
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