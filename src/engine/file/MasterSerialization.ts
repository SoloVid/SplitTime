namespace SplitTime.file {
    export class MasterSerialization implements AnySerializer {
        public readonly data: serialized_format_t = {}
        private nextUniqueId: int = 10
        private idObjectPairs: { id: int; object: any }[] = []

        constructor(
            private readonly objectSerializers: {
                id: string
                serializer: ObjectSerializer<unknown>
            }[]
        ) {
            for (const s of objectSerializers) {
                this.data[s.id] = []
            }
        }

        serialize<O extends object, T>(thing: O): int {
            for (const pair of this.idObjectPairs) {
                if (pair.object === thing) {
                    return pair.id
                }
            }

            for (const s of this.objectSerializers) {
                const st = s.serializer as ObjectSerializer<T>
                if (st.isT(thing)) {
                    const id = this.nextUniqueId++
                    this.idObjectPairs.push({
                        id: id,
                        object: thing
                    })
                    const bucket = this.data[s.id] as serialized_object_bucket_t
                    if (typeof bucket !== "object") {
                        throw new Error(
                            'Missing data bucket for serialized objects of type "' +
                                s.id +
                                '"'
                        )
                    }
                    if (id in bucket) {
                        throw new Error(
                            'There appears to be an object of type "' +
                                s.id +
                                '" already serialized with ID ' +
                                id
                        )
                    }
                    const json = st.serialize(this, thing)
                    bucket[id] = json
                    return id
                }
            }

            throw new Error(
                "Unable to find object serializer for object of type " +
                    thing.constructor.name +
                    ": " +
                    JSON.stringify(thing)
            )
        }
    }
}
