import { serialized_object_t } from "./serialized-format-t";
export interface AnySerializer {
    serialize<T extends object>(thing: T): serialized_object_t;
}
export interface AnyDeserializer {
    deserialize<T extends object>(serializedId: serialized_object_t): PromiseLike<T>;
}
