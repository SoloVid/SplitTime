namespace splitTime.conversation {
    export class SectionSpec {
        private parent: SectionSpec | null = null

        public readonly localSpeakers: readonly Speaker[] = []
        public readonly parts: readonly SectionSpecPart[] = []

        constructor(
            basicParts: readonly SectionSpecRawPart[],
            public readonly interruptibles: readonly InterruptibleSpec[] = [],
            public readonly detectionInterruptibles: readonly InterruptibleSpec[] = [],
            public readonly cancelSection: SectionSpec | null = null
        ) {
            const speakers: Speaker[] = []
            const formalizedParts: SectionSpecPart[] = []
            let groupOfLines: Line[] = []
            for (const part of basicParts) {
                if (part instanceof Line) {
                    groupOfLines.push(part)

                    if (speakers.indexOf(part.speaker) < 0) {
                        speakers.push(part.speaker)
                    }
                } else {
                    formalizedParts.push(new LineSequence(groupOfLines, this))
                    groupOfLines = []

                    part.setParent(this)
                    formalizedParts.push(part)
                }
            }
            formalizedParts.push(new LineSequence(groupOfLines, this))

            this.localSpeakers = speakers
            this.parts = formalizedParts
        }

        setParent(parent: SectionSpec): void {
            assert(this.parent === null, "SectionSpec parent can only be set once")
            this.parent = parent
        }

        getParent(): SectionSpec | null {
            return this.parent
        }

        forEachDetectionInterruptible(
            callback: (interruptible: InterruptibleSpec) => void
        ) {
            for (const interruptible of this.detectionInterruptibles) {
                callback(interruptible)
            }
            if (this.parent !== null) {
                this.parent.forEachDetectionInterruptible(callback)
            }
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
