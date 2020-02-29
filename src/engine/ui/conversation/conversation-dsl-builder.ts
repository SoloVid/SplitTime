namespace splitTime.conversation {
    export class ConversationDslBuilder implements DSL {
        private sectionBuilder: SectionBuilder

        constructor(
            topLevelSectionBuilder: SectionBuilder
        ) {
            this.sectionBuilder = topLevelSectionBuilder
        }

        say(speaker: Speaker, line: string): void {
            const lineObj = new Line(speaker, line)
            this.sectionBuilder.append(lineObj)
        }

        section(setup: () => void): SectionBuilderFluentReturn {
            const newSectionBuilder = new SectionBuilder()
            this.withSectionBuilder(newSectionBuilder, setup)
            this.sectionBuilder.append(newSectionBuilder)
            return new SectionBuilderFluentReturn(newSectionBuilder, this)
        }

        do(action: MidConversationCallback): void {
            this.sectionBuilder.append(new MidConversationAction(action))
        }

        // waitUntil(condition: Condition): void {
        //     this.sectionBuilder.append(new Wait(condition))
        // }

        withSectionBuilder(sectionBuilder: SectionBuilder, callback: () => void): void {
            const prevSection = this.sectionBuilder
            try {
                this.sectionBuilder = sectionBuilder
                callback()
            } finally {
                this.sectionBuilder = prevSection
            }
        }
    }
}
