namespace SplitTime.file {
    export class MasterSerializer {
        private nextUniqueId: int = 10
        private objectSerializers: {
            id: string
            serializer: ObjectSerializer<any>
        }[] = []
        private specialSerializers: {
            id: string
            serializer: SpecialSerializer
        }[] = []
        // private generalSerializers: GeneralSerializer[] = [];
        // private serializationRoutines: ((s: AnySerializer) => void)[] = [];

        registerObjectSerializer<T>(id: string, s: ObjectSerializer<T>): void {
            for (const item of this.objectSerializers) {
                if (item.id === id) {
                    throw new Error(
                        'Object serializer "' + id + '" is already registered'
                    )
                }
            }
            this.objectSerializers.push({
                id: id,
                serializer: s
            })
        }

        registerSpecialSerializer(id: string, s: SpecialSerializer): void {
            for (const item of this.specialSerializers) {
                if (item.id === id) {
                    throw new Error(
                        'Special serializer "' + id + '" is already registered'
                    )
                }
            }
            this.specialSerializers.push({
                id: id,
                serializer: s
            })
        }

        // registerGeneralSerializer(s: GeneralSerializer): void {
        //     this.generalSerializers.push(s);
        // }

        // registerSerializationRoutine(callback: (s: AnySerializer) => void): void {
        //     this.serializationRoutines.push(callback);
        // }

        getUniqueId(): int {
            return this.nextUniqueId++
        }

        serialize(): jsonable {
            const temp = new MasterSerialization(this.objectSerializers)
            // for(const s of this.generalSerializers) {
            //     s.serialize(temp);
            // }
            for (const s of this.specialSerializers) {
                temp.data[s.id] = s.serializer.serialize(temp)
            }
            return temp.data
        }

        deserialize(data: jsonable): void {
            const temp = new MasterDeserialization(data, this.objectSerializers)
            // for(const s of this.generalSerializers) {
            //     s.deserialize(temp);
            // }
            for (const s of this.specialSerializers) {
                s.serializer.deserialize(temp, temp.data[s.id])
            }
        }
    }
}
