namespace splitTime.file {
    // From https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
    // type FilterFlags<Base, Condition> = {
    //     [Key in keyof Base]: 
    //         Base[Key] extends Condition ? Key : never
    // };
    // type AllowedNames<Base, Condition> = 
    //         FilterFlags<Base, Condition>[keyof Base];
    // type SubType<Base, Condition> = 
    //         Pick<Base, AllowedNames<Base, Condition>>;

            
    type primitive = null
        | boolean
        | number
        | string
    // export type jsonable = primitive
    //     | jsonable[]
    //     | { [key: string]: jsonable }
    //     | { [key: number]: jsonable }

    type jsonable =
        | null
        | boolean
        | number
        | string
        | jsonable[]
        | { [prop: string]: jsonable };
    // type jsonable = primitive | jsonable_object | jsonable_array

    // interface jsonable_object {
    //     // [x: string]: string | number | boolean | jsonable_object | jsonable_array;
    //     [x: string]: jsonable;
    // }

    // // interface jsonable_object2 {
    // //     [x: number]: jsonable
    // // }

    // interface jsonable_array extends Array<jsonable> { }


    // type MadeJsonable<T> = T extends (infer U)[] ? MadeJsonable<U>[] : SubType<T, jsonable>
    // export type IsJsonable<T> = 
    //     T extends primitive
    //         ? T
    //         : T extends (infer U)[]
    //             ? IsJsonable<U> extends U
    //                 ? T
    //                 : never
    //             : T extends MadeJsonable<T>
    //                 ? MadeJsonable<T> extends T
    //                     ? T
    //                     : never
    //                 : never
    // export type MadeJsonable<T> = 
    //     { [K in keyof T]: T[K] extends jsonable
    //         ? T[K]
    //         : T[K] extends Function
    //         ? never
    //         : MadeJsonable<T[K]> extends jsonable
    //         ? MadeJsonable<T[K]>
    //         : never
    //     }

    type DefinitelyNotJsonable = (() => any) | undefined

    // From https://github.com/microsoft/TypeScript/issues/1897#issuecomment-580962081
    export type IsJsonable<T> = T extends DefinitelyNotJsonable
        ? never
        : T extends primitive
            // Primitive is acceptable
            ? T
            : T extends (infer U)[]
                // Arrays are special; just check array element type
                ? IsJsonable<U>[]
                : T extends object
                    ? {
                        // Iterate over keys in object case
                        // [P in keyof T]: IsJsonable<T[P]>
                        [P in keyof T]: T[P] extends jsonable
                            ? T[P]
                            // I don't understand this part, and it didn't seem to work for me
                            // : Pick<T, P> extends Required<Pick<T, P>>
                            // ? never
                            : T[P] extends DefinitelyNotJsonable
                                // Don't allow function or undefined
                                ? never
                                : IsJsonable<T[P]>
                    }
                    // any other non-object no bueno
                    : never

    type FD = level.FileData
    type FDP = FD extends primitive ? "yes" : "no"
    type FDA = FD extends (infer U)[] ? "yes" : "no"
    type FDMJ = { [P in keyof FD]: FD[P] extends jsonable ? "yes" : "no" }
    type FDMP = { [P in keyof FD]: Pick<FD, P> extends Required<Pick<FD, P>> ? "yes" : "no" }
    type P = Pick<FD, "layers">
    type R = Required<Pick<FD, "layers">>
    type A = level.file_data.Layer[]

    export type json = string

    // let as = [1, "himom", {}]
    // type a1 = typeof as
    // type a2 = MadeJsonable<a1>
    // let as2: file.IsJsonable<typeof as> = as

    // type b = level.FileData
    // type bt = JsonCompatible<b>
    // type b2 = MadeJsonable<b>
    // type b3 = SubType<b, jsonable>

    type la = level.file_data.Layer[]
    type lat = la extends (infer U)[] ? "yes" : "no"
    // type lat = la extends { [key: string]: string | number }[] ? "yes" : never
    // type lak = keyof la
    // type la2 = MadeJsonable<la>
    // type la2k = keyof la2

    // type l = level.file_data.Layer
    // type l2 = MadeJsonable<l>

    // type ll = l extends jsonable ? "yes" : "no"


    export function toJsonable(thing: unknown): jsonable {
        return JSON.parse(JSON.stringify(thing))
    }

    class JsonType {
        public constructor(public readonly id: string) {}
    }

    type deserializer = (serialized: json) => void

    export class JsonHandler {
        private deserializers: { [id: string]: deserializer } = {}

        toJson(thing: jsonable, type: JsonType): json {
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
    export function jsonable(thing: unknown): thing is file.jsonable {
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
                        if (!jsonable(obj[key])) {
                            return false
                        }
                    }
                    return true
                } else if (prototype === Array.prototype) {
                    const arr = thing as unknown[]
                    for (const item of arr) {
                        if (!jsonable(item)) {
                            return false
                        }
                    }
                    return true
                }
        }
        return false
    }
}
