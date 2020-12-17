namespace splitTime.world {
    type Processor = (spriteBody: SpriteBody, rawProp: level.file_data.Prop) => void
    export class PropPostProcessor {
        private readonly processorMap: { [id: string]: Processor } = {}

        register(processorId: string, processor: Processor): void {
            if (DEBUG) {
                assert(!(processorId in this.processorMap), "Processor \"" + processorId + "\" already registered")
            }
            this.processorMap[processorId] = processor
        }

        process(processorId: string, newProp: SpriteBody, rawProp: level.file_data.Prop): void {
            if (DEBUG) {
                assert(processorId in this.processorMap, "Processor \"" + processorId + "\" not registered")
            }
            this.processorMap[processorId](newProp, rawProp)
        }
    }
}