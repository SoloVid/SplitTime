namespace splitTime.conversation {
    export class ConversationSpecManager {
        private readonly builders: { [id: string]: ConversationSpecBuilder | undefined } = {}
        private readonly specs: { [id: string]: ConversationSpec | undefined } = {}

        constructor(
            private readonly startConversation: (inst: ConversationInstance) => void
        ) {}

        register(id: string, setup: SetupFunc, options?: Partial<Options>): time.EventSpec<void> {
            this.builders[id] = new ConversationSpecBuilder(setup, options)
            return new time.EventSpec(id, () => this.start(id))
        }

        getSpecById(id: string): ConversationSpec {
            let spec = this.specs[id]
            if (!spec) {
                const builder = this.builders[id]
                assert(!!builder, "Conversation spec \"" + id + "\" not found")
                spec = this.specs[id] = builder.build()
            }
            return spec
        }

        private start(id: string): void {
            const spec = this.getSpecById(id)
            const inst = new ConversationInstance(spec)
            this.startConversation(inst)
        }
    }
}