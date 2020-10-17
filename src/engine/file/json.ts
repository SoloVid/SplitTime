namespace splitTime.file {
    // Some reference material:
    // https://www.typescriptlang.org/docs/handbook/advanced-types.html
    // https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c

    type primitive = null
        | boolean
        | number
        | string

    type DefinitelyNotJsonable = (() => any) | undefined

    export type IsJsonable<T> =
        // Check if there are any non-jsonable types represented in the union
        // Note: use of tuples in this first condition side-steps distributive conditional types
        // (see https://github.com/microsoft/TypeScript/issues/29368#issuecomment-453529532)
        [Extract<T, DefinitelyNotJsonable>] extends [never]
            // Non-jsonable type union was found empty
            ? T extends primitive
                // Primitive is acceptable
                ? T
                // Otherwise check if array
                : T extends (infer U)[]
                    // Arrays are special; just check array element type
                    ? IsJsonable<U>[]
                    // Otherwise check if object
                    : T extends object
                        // It's an object
                        ? {
                            // Iterate over keys in object case
                            [P in keyof T]:
                                // Recursive call for children
                                IsJsonable<T[P]>
                        }
                        // Otherwise any other non-object no bueno
                        : never
            // Otherwise non-jsonable type union was found not empty
            : never

    export type json = string

    type JustNonNeverKeys<T> = { [K in keyof T]: T[K] extends never ? never : K }[keyof T]
    type MadeJsonableInner<T> = T extends object ? { [K in JustNonNeverKeys<T>]: MadeJsonableInner<T[K]> } : T
    export type MadeJsonable<T> = MadeJsonableInner<IsJsonable<T>>

    type nevobj1 = never extends object ? "yes" : "no"
    type nevobj2 = object extends never ? "yes" : "no"
    type nevnum = number extends never ? "yes" : "no"
    type c0 = IsJsonable<() => void>
    type c = MadeJsonable<() => void>
    type c01 = IsJsonable<splitTime.Level["region"]>
    type c1 = MadeJsonable<splitTime.Level["region"]>
    type c2 = MadeJsonable<splitTime.Level>
    type d = { [K in keyof { a: number, b: never, c: null }]: true}
    type d1 = { [K in JustNonNeverKeys<{ a: number, b: never, c: null }>]: true }
    type d2 = object extends IsJsonable<splitTime.Level["region"]> ? "yes" : "no"

    export function toJsonable<T>(thing: T): MadeJsonable<T> {
        // FTODO: maybe actually strip out keys?
        return JSON.parse(JSON.stringify(thing)) as MadeJsonable<T>
    }

    class JsonType {
        public constructor(public readonly id: string) {}
    }

    type deserializer = (serialized: json) => void

    export class JsonHandler {
        private deserializers: { [id: string]: deserializer } = {}

        toJson(thing: IsJsonable<unknown>, type: JsonType): json {
            return JSON.stringify({
                type: type.id,
                data: thing
            })
        }

        fromJson(serialized: json) {
            const obj = JSON.parse(serialized)
            if (!(obj.type in this.deserializers)) {
                throw new Error(
                    'Unable to deserialize object of type "' +
                        obj.type +
                        '" because no deserializer was found'
                )
            }
            this.deserializers[obj.type](obj.data)
        }

        registerDeserializer(id: string, handler: deserializer): JsonType {
            const type = new JsonType(id)
            if (type.id in this.deserializers) {
                throw new Error(
                    'JSON deserializer "' + id + '" is already defined'
                )
            }
            this.deserializers[type.id] = handler
            return type
        }
    }
}

namespace splitTime.instanceOf {
    export function jsonable<T>(thing: file.IsJsonable<T>): thing is file.IsJsonable<T> {
        const type = typeof thing
        switch (type) {
            case "boolean":
            case "number":
            case "string":
                return true
            case "object":
                const prototype = Object.getPrototypeOf(thing)
                if (prototype === Object.prototype) {
                    const obj = thing as { [key: string]: unknown }
                    for (const key in obj) {
                        if (!jsonable(obj[key] as file.IsJsonable<unknown>)) {
                            return false
                        }
                    }
                    return true
                } else if (prototype === Array.prototype) {
                    const arr = thing as unknown[]
                    for (const item of arr) {
                        if (!jsonable(item as file.IsJsonable<unknown>)) {
                            return false
                        }
                    }
                    return true
                }
        }
        return false
    }
}
