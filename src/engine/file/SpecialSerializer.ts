namespace SplitTime.file {
    export interface SpecialSerializer {
        id: string
        serialize(s: AnySerializer): jsonable
        deserialize(s: AnyDeserializer, data: jsonable): void
    }
}
