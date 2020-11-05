namespace splitTime.conversation {
    export class SectionSpec {
        private parent: SectionSpec | ConversationSpec | null = null

        constructor(
            private readonly localSpeakers: readonly Speaker[] = [],
            public readonly parts: readonly SectionSpecPart[] = [],
            public readonly interruptibles: readonly InterruptibleSpec[] = [],
            public readonly cancelSection: SectionSpec | null = null
        ) {
            for (const part of parts) {
                part.setParent(this)
            }
        }

        setParent(parent: SectionSpec | ConversationSpec): void {
            assert(this.parent === null, "SectionSpec parent can only be set once")
            this.parent = parent
        }

        getParent(): SectionSpec | ConversationSpec {
            assert(this.parent !== null, "SectionSpec parent should not be null")
            return this.parent
        }

        getSpeakers(): Speaker[] {
            const speakers = this.localSpeakers.slice()
            if (this.parent instanceof SectionSpec) {
                for (const speaker of this.parent.getSpeakers()) {
                    if (speakers.indexOf(speaker) < 0) {
                        speakers.push(speaker)
                    }
                }
            }
            return speakers
        }
    }
}
