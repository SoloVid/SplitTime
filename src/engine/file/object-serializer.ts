namespace SplitTime.file {
    export interface ObjectSerializer<T> {
        isT(thing: any): thing is T
        serialize(s: AnySerializer, thing: T): jsonable
        deserialize(s: AnyDeserializer, data: jsonable): T
    }
}
