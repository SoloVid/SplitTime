// Some reference material:
// https://www.typescriptlang.org/docs/handbook/advanced-types.html
// https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
type primitive = null | boolean | number | string;
type Function2 = ((...args: any[]) => any)
type DefinitelyNotJsonable = Function2 | undefined;
/**
 * Returns an unsatisfiable type (will have never components) if the type T
 * is not a simple object that may be demonstrably converted to JSON without loss.
 *
 * Use this type to wrap parameter types or return types that should be able to convert to JSON.
 *
 * If AllowUnknown is true, unknown components will result in unknown.
 * If AllowUnknown is false, unknown components will result in an unsatisfiable type (a never).
 */
export type IsJsonable<T, AllowUnknown = true, AllowUndefined = false> = 
// Check if there are any non-jsonable types represented in the union
// Note: use of tuples in this first condition side-steps distributive conditional types
// (see https://github.com/microsoft/TypeScript/issues/29368#issuecomment-453529532)
[
    Extract<T, AllowUndefined extends false ? DefinitelyNotJsonable : Function2>
] extends [
    never
] ? T extends primitive ? T : T extends (infer U)[] ? IsJsonable<U, AllowUnknown, AllowUndefined>[] : T extends object ? {
    [K in keyof T]: T[K];
} extends T ? {
    [P in keyof T]: 
    // Recursive call for children
    IsJsonable<T[P], AllowUnknown, AllowUndefined>;
} : never : AllowUnknown extends false ? never : [
    Exclude<T, unknown>
] extends [
    never
] ? unknown extends T ? unknown : never : never : never;
export type json = string;
export type IsJsonableOrVoid<T> = T extends void ? void : IsJsonable<T>;
type JustNonNeverKeys<T> = {
    [K in keyof T]: T[K] extends never ? never : K;
}[keyof T];
type MadeJsonableInner<T> = T extends object ? {
    [K in JustNonNeverKeys<T>]: MadeJsonableInner<T[K]>;
} : T;
/**
 * Create a slimmer form of type T which will satisfy {@link IsJsonable<T>}.
 * In other words, this will strip out function and undefined components of type T.
 */
export type MadeJsonable<T> = MadeJsonableInner<IsJsonable<T>>;
export function toJsonable<T>(thing: T): MadeJsonable<T> {
    // FTODO: maybe actually strip out keys?
    return JSON.parse(JSON.stringify(thing)) as MadeJsonable<T>;
}
/** @deprecated doesn't actually work as intended; use IsJsonable paradigm instead */
export type jsonable = primitive | jsonable[] | {
    [key: string]: jsonable;
};
class JsonType {
    public constructor(public readonly id: string) { }
}
type deserializer = (serialized: json) => void;
export class JsonHandler {
    private deserializers: {
        [id: string]: deserializer;
    } = {};
    toJson(thing: IsJsonable<unknown>, type: JsonType): json {
        return JSON.stringify({
            type: type.id,
            data: thing
        });
    }
    fromJson(serialized: json) {
        const obj = JSON.parse(serialized);
        if (!(obj.type in this.deserializers)) {
            throw new Error('Unable to deserialize object of type "' +
                obj.type +
                '" because no deserializer was found');
        }
        this.deserializers[obj.type](obj.data);
    }
    registerDeserializer(id: string, handler: deserializer): JsonType {
        const type = new JsonType(id);
        if (type.id in this.deserializers) {
            throw new Error('JSON deserializer "' + id + '" is already defined');
        }
        this.deserializers[type.id] = handler;
        return type;
    }
}
export function instanceOfJsonable<T>(thing: IsJsonable<T>): thing is IsJsonable<T> {
    const type = typeof thing;
    switch (type) {
        case "boolean":
        case "number":
        case "string":
            return true;
        case "object":
            const prototype = Object.getPrototypeOf(thing);
            if (prototype === Object.prototype) {
                const obj = thing as {
                    [key: string]: unknown;
                };
                for (const key in obj) {
                    if (!instanceOfJsonable(obj[key] as IsJsonable<unknown>)) {
                        return false;
                    }
                }
                return true;
            }
            else if (prototype === Array.prototype) {
                const arr = thing as unknown[];
                for (const item of arr) {
                    if (!instanceOfJsonable(item as IsJsonable<unknown>)) {
                        return false;
                    }
                }
                return true;
            }
    }
    return false;
}
