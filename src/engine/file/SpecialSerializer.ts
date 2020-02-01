namespace SplitTime.file {
    export interface SpecialSerializer {
        serialize(s: AnySerializer): jsonable;
        deserialize(s: AnyDeserializer, data: jsonable): void;
    }
}