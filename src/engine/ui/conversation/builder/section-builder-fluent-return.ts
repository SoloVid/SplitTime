namespace splitTime.conversation {
    export class SectionBuilderFluentReturn implements SectionChain {
        constructor(
            private readonly sectionBuilder: SectionBuilder,
            private readonly helper: ConversationDslBuilder
        ) {}

        cancelable(setup: () => void = () => {}): SectionBuilderFluentReturn {
            const newSectionBuilder = new SectionBuilder()
            this.helper.withSectionBuilder(newSectionBuilder, setup)
            this.sectionBuilder.setCancelSection(newSectionBuilder)
            return this
        }

        interruptible(
            condition: Condition = true,
            setup: () => void = () => {},
            ...events: body.CustomEventHandler<void>[]
        ): SectionBuilderFluentReturn {
            const newSectionBuilder = new SectionBuilder()
            this.helper.withSectionBuilder(newSectionBuilder, setup)
            this.sectionBuilder.addInterruptible(
                new InterruptibleSpecBuilder(events, condition, newSectionBuilder)
            )
            return this
        }
    }
}
