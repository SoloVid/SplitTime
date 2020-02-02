namespace SplitTime.conversation {
    export class SectionReturn implements SectionChain {
        constructor(
            private readonly section: Section,
            private readonly helper: OrchestrationHelper
        ) {}

        cancelable(setup: () => void = () => {}): SectionReturn {
            const newSection = new Section(this.section.parentSection)
            this.helper.withSection(newSection, setup)
            this.section.setCancelSection(newSection)
            return this
        }

        interruptible(
            condition: condition_t = true,
            setup: () => void = () => {}
        ): SectionReturn {
            const newSection = new Section(this.section.parentSection)
            this.helper.withSection(newSection, setup)
            this.section.addInterruptible(
                new Interruptible(condition, newSection)
            )
            return this
        }

        interruptibleByDetection(
            condition: condition_t = true,
            setup: () => void = () => {},
            body?: Body
        ): SectionReturn {
            const newSection = new Section(this.section.parentSection)
            this.helper.withSection(newSection, setup)
            this.section.addDetectionInterruptible(
                new Interruptible(condition, newSection, body)
            )
            return this
        }
    }
}
