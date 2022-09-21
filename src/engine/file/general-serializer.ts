import { AnySerializer, AnyDeserializer } from "./any-serializer";
export interface GeneralSerializer {
    serialize(s: AnySerializer): void;
    deserialize(s: AnyDeserializer): void;
}
