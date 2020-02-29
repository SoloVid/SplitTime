namespace SplitTime.file {
    export interface GeneralSerializer {
        serialize(s: AnySerializer): void
        deserialize(s: AnyDeserializer): void
    }
}
