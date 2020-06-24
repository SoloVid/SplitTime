namespace splitTime.conversation {
    export type SetupFunc = (d: DSL) => void
    interface Starter {
        start(spec: ConversationSpec): void
    }

    export class ConversationSpec {
        private cachedSection: SectionSpec | null = null
        private readonly eventSpec: time.EventSpec<void>

        constructor(
            public readonly id: string,
            private readonly setup: SetupFunc,
            private readonly starter: Starter
        ) {
            this.eventSpec = new splitTime.time.EventSpec(this.id, () => {
                console.log("Start " + this.id)
                this.starter.start(this)
            })
        }

        getTopLevelSectionSpec(): SectionSpec {
            if(this.cachedSection === null) {
                const builder = new SectionBuilder()
                const dsl = new ConversationDslBuilder(builder)
                this.setup(dsl)
                this.cachedSection = builder.build()
            }
            return this.cachedSection
        }

        inst(): time.EventInstance<void> {
            return this.eventSpec.inst()
        }
    }
}