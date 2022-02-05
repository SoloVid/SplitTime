import { AnySerializer, AnyDeserializer } from "./any-serializer";
import { jsonable } from "./json";
export interface SpecialSerializer {
    id: string;
    serialize(s: AnySerializer): jsonable;
    deserialize(s: AnyDeserializer, data: jsonable): void;
}
