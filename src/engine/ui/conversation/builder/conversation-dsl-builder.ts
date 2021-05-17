namespace splitTime.conversation {
    export class ConversationDslBuilder implements DSL {
        private sectionBuilder: SectionBuilder

        constructor(
            private readonly options?: Partial<Options>
        ) {
            this.sectionBuilder = new SectionBuilder(options)
        }

        listen(speaker: Speaker): void {
            this.sectionBuilder.addSpeaker(speaker)
        }

        message(line: string, options?: Partial<Options>): void {
            const lineObj = new Line(null, line, options)
            this.sectionBuilder.append(lineObj)
        }

        say(speaker: Speaker, line: string, options?: Partial<Options>): void {
            this.sectionBuilder.addSpeaker(speaker)
            const lineObj = new Line(speaker, line, options)
            this.sectionBuilder.append(lineObj)
        }

        section(setup: () => void, options?: Partial<Options>): SectionBuilderFluentReturn {
            const newSectionBuilder = new SectionBuilder()
            this.withSectionBuilder(newSectionBuilder, setup)
            this.sectionBuilder.append(newSectionBuilder)
            return new SectionBuilderFluentReturn(newSectionBuilder, this)
        }

        do(action: time.MidEventCallback): void {
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

        build(): ConversationSpec {
            return new ConversationSpec("TODO: ID", this.sectionBuilder.build())
        }
    }
}
