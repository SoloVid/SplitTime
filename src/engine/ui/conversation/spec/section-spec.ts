namespace splitTime.conversation {
    export class SectionSpec {
        private parent: SectionSpec | ConversationSpec | null = null

        public readonly localSpeakers: readonly Speaker[] = []

        constructor(
            public readonly parts: readonly SectionSpecPart[] = [],
            public readonly interruptibles: readonly InterruptibleSpec[] = [],
            public readonly cancelSection: SectionSpec | null = null
        ) {
            // TODO: get speakers
            const speakers: Speaker[] = []
            for (const part of parts) {
                part.setParent(this)
            }

            this.localSpeakers = speakers
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
            if (this.parent !== null) {
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
