namespace splitTime.file {
    export class ObjectSerializerPool {
        private readonly objectSerializers: { [id: string]: ObjectSerializer<unknown> } = {}

        constructor() {
        }

        forEach(callback: (id: string, serializer: ObjectSerializer<unknown>) => void): void {
            for(const id in this.objectSerializers) {
                callback(id, this.objectSerializers[id])
            }
        }

        serializerExists<T extends object>(thing: T): boolean {
            try {
                this.getSerializer(thing);
                return true;
            } catch (e) {
                return false;
            }
        }

        registerSerializer<T>(id: string, s: ObjectSerializer<T>): void {
            if(!!this.objectSerializers[id]) {
                throw new Error(
                    'Object serializer "' + id + '" is already registered'
                )
            }
            this.objectSerializers[id] = s
        }

        getSerializerById<T>(id: string): ObjectSerializer<T> {
            const s = this.objectSerializers[id]
            assert(!!s, "Serializer \"" + id + "\" not found")
            return s as ObjectSerializer<T>
        }
        
        getSerializerId<T>(serializer: ObjectSerializer<T>): string {
            for(const id in this.objectSerializers) {
                const s = this.objectSerializers[id]
                if(s === serializer) {
                    return id
                }
            }
            throw new Error("Serializer not found")
        }

        getSerializer<O extends object, T>(thing: O): ObjectSerializer<T> {
            for(const id in this.objectSerializers) {
                const s = this.objectSerializers[id]
                const st = s as ObjectSerializer<T>
                if (st.isT(thing)) {
                    return st
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
