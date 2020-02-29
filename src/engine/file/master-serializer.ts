namespace splitTime.file {
    export class MasterSerializer {
        public readonly objectSerializerPool: ObjectSerializerPool = new ObjectSerializerPool()
        private readonly specialSerializers: SpecialSerializer[] = []

        registerObjectSerializer<T>(id: string, s: ObjectSerializer<T>): void {
            this.objectSerializerPool.registerSerializer(id, s)
        }

        registerSpecialSerializer(s: SpecialSerializer): void {
            for (const item of this.specialSerializers) {
                if (item.id === s.id) {
                    throw new Error(
                        'Special serializer "' + s.id + '" is already registered'
                    )
                }
            }
            this.specialSerializers.push(s)
        }

        serialize(): jsonable {
            const temp = new MasterSerialization(this.objectSerializerPool)
            for (const s of this.specialSerializers) {
                temp.data[s.id] = s.serialize(temp)
            }
            return temp.data
        }

        deserialize(data: jsonable): void {
            const temp = new MasterDeserialization(data, this.objectSerializerPool)
            for (const s of this.specialSerializers) {
                s.deserialize(temp, temp.data[s.id])
            }
        }
    }
}
