namespace splitTime.file {
    export interface ObjectSerializer<T> {
        isT(thing: unknown): thing is T
        serialize(s: AnySerializer, thing: T): jsonable
        deserialize(s: AnyDeserializer, data: jsonable): T
    }
}
