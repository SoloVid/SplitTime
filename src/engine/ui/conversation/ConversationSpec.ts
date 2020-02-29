namespace SplitTime.conversation {
    export type SetupFunc = (d: DSL) => void

    export class ConversationSpec {
        private cachedSection: SectionSpec | null = null

        constructor(
            public readonly id: string,
            private readonly setup: SetupFunc
        ) {}

        getTopLevelSectionSpec(): SectionSpec {
            if(this.cachedSection === null) {
                const builder = new SectionBuilder()
                const dsl = new ConversationDslBuilder(builder)
                this.setup(dsl)
                this.cachedSection = builder.build()
            }
            return this.cachedSection
        }
    }
}