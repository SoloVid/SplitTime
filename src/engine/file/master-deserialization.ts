namespace splitTime.file {
    class DeserializeSecondPass implements AnyDeserializer {
        private idPromisePairs: { objectId: int; promise: splitTime.Pledge }[] = []

        constructor(
            private readonly idObjectPairs: { id: int; object: any }[] = []
        ) {}

        deserialize<T>(id: int): PromiseLike<T> {
            const objectAlreadyHere = this.getObject(id) as T
            if (objectAlreadyHere) {
                return Promise.resolve(objectAlreadyHere)
            }
            const promise = new splitTime.Pledge()
            this.idPromisePairs.push({
                objectId: id,
                promise: promise
            })
            return promise
        }

        resolvePromises(): void {
            for (const pair of this.idPromisePairs) {
                this.resolveSinglePromise(pair.objectId, pair.promise)
            }
        }

        private resolveSinglePromise(
            objectId: int,
            promise: splitTime.Pledge
        ): void {
            const obj = this.getObject(objectId)
            if (obj) {
                promise.resolve(obj)
            } else {
                throw new Error("Unable to find object with ID " + objectId)
            }
        }

        private getObject<T>(objectId: int): T | null {
            for (const pair of this.idObjectPairs) {
                if (pair.id === objectId) {
                    return pair.object
                }
            }
            return null
        }
    }

    export class MasterDeserialization {
        public readonly data: serialized_format_t
        private idObjectPairs: { id: int; object: any }[] = []
        private secondPass: DeserializeSecondPass

        constructor(
            rawData: jsonable,
            objectSerializationPool: ObjectSerializerPool
        ) {
            if (typeof rawData !== "object") {
                throw new Error("Serialized data is not an object as expected")
            }
            this.data = rawData as serialized_format_t
            this.secondPass = new DeserializeSecondPass(this.idObjectPairs)
            objectSerializationPool.forEach((id, s) => {
                const bucket = this.data[id] as serialized_object_bucket_t
                if (typeof bucket !== "object") {
                    throw new Error(
                        'Missing data bucket for serialized objects of type "' +
                            id +
                            '"'
                    )
                }
                for (const objectId in bucket) {
                    const objectIdN = +objectId
                    const json = bucket[objectIdN]
                    const thing = s.deserialize(
                        this.secondPass,
                        json
                    )
                    this.idObjectPairs.push({
                        id: objectIdN,
                        object: thing
                    })
                }
            })
        }

        deserialize<T>(id: int): PromiseLike<T> {
            return this.secondPass.deserialize(id)
        }
    }
}
