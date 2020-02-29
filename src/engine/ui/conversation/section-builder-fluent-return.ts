namespace SplitTime.conversation {
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
            setup: () => void = () => {}
        ): SectionBuilderFluentReturn {
            const newSectionBuilder = new SectionBuilder()
            this.helper.withSectionBuilder(newSectionBuilder, setup)
            this.sectionBuilder.addInterruptible(
                new InterruptibleSpecBuilder(condition, newSectionBuilder)
            )
            return this
        }

        interruptibleByDetection(
            condition: Condition = true,
            setup: () => void = () => {},
            body?: Body
        ): SectionBuilderFluentReturn {
            const newSectionBuilder = new SectionBuilder()
            this.helper.withSectionBuilder(newSectionBuilder, setup)
            this.sectionBuilder.addDetectionInterruptible(
                new InterruptibleSpecBuilder(condition, newSectionBuilder, body)
            )
            return this
        }
    }
}
