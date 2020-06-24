namespace splitTime.file {
    export class MasterSerialization implements AnySerializer {
        public readonly data: serialized_format_t = {}
        private nextUniqueId: int = 10
        private idObjectPairs: { id: int; object: object }[] = []

        constructor(
            private readonly objectSerializerPool: ObjectSerializerPool
        ) {
            this.objectSerializerPool.forEach(id => {
                this.data[id] = []
            })
        }

        serialize<O extends object, T>(thing: O): int {
            for (const pair of this.idObjectPairs) {
                if (pair.object === thing) {
                    return pair.id
                }
            }

            const serializer = this.objectSerializerPool.getSerializer(thing)
            const serializerId = this.objectSerializerPool.getSerializerId(serializer)
            const id = this.nextUniqueId++
            this.idObjectPairs.push({
                id: id,
                object: thing
            })
            const bucket = this.data[serializerId] as serialized_object_bucket_t
            if (typeof bucket !== "object") {
                throw new Error(
                    'Missing data bucket for serialized objects of type "' +
                    serializerId +
                        '"'
                )
            }
            if (id in bucket) {
                throw new Error(
                    'There appears to be an object of type "' +
                        serializerId +
                        '" already serialized with ID ' +
                        id
                )
            }
            const json = serializer.serialize(this, thing)
            bucket[id] = json
            return id
        }
    }
}
