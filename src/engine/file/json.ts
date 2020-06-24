namespace splitTime.file {
    export type jsonable =
        | boolean
        | number
        | string
        | jsonable[]
        | { [key: string]: jsonable }
        | { [key: number]: jsonable }
    export type json = string

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
