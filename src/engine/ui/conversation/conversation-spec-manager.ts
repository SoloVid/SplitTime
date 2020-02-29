namespace splitTime.conversation {
    export class ConversationSpecManager {
        // private pendingRegistrations: { id: string, setup: SetupFunc }[] = []
        private specs: { [id: string]: ConversationSpec } = {}

        constructor(
            private readonly helper: RunnerHelper
        ) {
        }

        register(id: string, setup: SetupFunc): ConversationSpec {
            const spec = new ConversationSpec(id, setup)
            this.specs[id] = spec
            return spec
        }

        // solidifyRegistrations(): void {
        //     for(const pen of this.pendingRegistrations) {
        //         const builder = new SectionBuilder()
        //         const dsl = new ConversationDslBuilder(builder)
        //         setup(dsl)
        //         const spec = new ConversationSpec(id, builder.build())
        //         this.specs[id] = spec
        //         return spec    
        //     }
        // }

        getSpecById(id: string): ConversationSpec {
            const spec = this.specs[id]
            assert(!!spec, "Conversation spec \"" + id + "\" not found")
            return spec
        }

        start(spec: ConversationSpec): void {
            const inst = new ConversationInstance(spec.getTopLevelSectionSpec(), this.helper)
            inst.start()
        }
    }
}