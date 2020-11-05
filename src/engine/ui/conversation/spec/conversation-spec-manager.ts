namespace splitTime.conversation {
    export class ConversationSpecManager {
        private specs: { [id: string]: ConversationSpec } = {}

        constructor(
            private readonly helper: RunnerHelper
        ) {
        }

        register(id: string, setup: SetupFunc): ConversationSpec {
            const builder = new ConversationDslBuilder()
            setup(builder)
            const spec = builder.build()
            this.specs[id] = spec
            return spec
        }

        getSpecById(id: string): ConversationSpec {
            const spec = this.specs[id]
            assert(!!spec, "Conversation spec \"" + id + "\" not found")
            return spec
        }

        start(spec: ConversationSpec): void {
            const inst = new ConversationInstance(spec.topLevelSection, this.helper)
            inst.start()
        }

        makeSpeaker(name: string, body: Body): Speaker {
            return new Speaker(name, body)
        }
    }
}