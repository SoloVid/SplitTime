import { AnySerializer, AnyDeserializer } from "./any-serializer";
import { jsonable } from "./json";
export interface ObjectSerializer<T> {
    isT(thing: unknown): thing is T;
    serialize(s: AnySerializer, thing: T): jsonable;
    deserialize(s: AnyDeserializer, data: jsonable): T;
}
