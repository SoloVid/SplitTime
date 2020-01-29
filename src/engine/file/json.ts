namespace SplitTime.file {
    export type jsonable = boolean | number | string | jsonable[] | { [key: string]: jsonable };
    export type json = string;

    export function toJsonable(thing: any): jsonable {
        return JSON.parse(JSON.stringify(thing));
    }

    class JsonType {
        public constructor(public readonly id: string) {}
    }

    type deserializer = (serialized: json) => void;

    export class JsonHandler {
        private deserializers: { [id: string]: deserializer } = {};

        toJson(thing: jsonable, type: JsonType): json {
            return JSON.stringify({
                type: type.id,
                data: thing
            });
        }

        fromJson(serialized: json) {
            const obj = JSON.parse(serialized);
            if(!(obj.type in this.deserializers)) {
                throw new Error("Unable to deserialize object of type \"" + obj.type + "\" because no deserializer was found");
            }
            this.deserializers[obj.type](obj.data);
        }

        registerDeserializer(id: string, handler: deserializer): JsonType {
            const type = new JsonType(id);
            if(type.id in this.deserializers) {
                throw new Error("JSON deserializer \"" + id + "\" is already defined");
            }
            this.deserializers[type.id] = handler;
            return type;
        }
    }
}