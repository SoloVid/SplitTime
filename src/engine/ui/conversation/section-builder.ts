namespace SplitTime.conversation {
    type BuilderPart = SectionBuilder | Line | MidConversationAction
    export class SectionBuilder {
        private readonly parts: BuilderPart[] = []
        private cancelSection: SectionBuilder | null = null
        private interruptibles: InterruptibleSpecBuilder[] = []
        private detectionInterruptibles: InterruptibleSpecBuilder[] = []

        append(part: BuilderPart): void {
            this.parts.push(part)
        }

        setCancelSection(section: SectionBuilder): void {
            if(this.cancelSection !== null) {
                throw new Error("Cancel section already set")
            }
            this.cancelSection = section
        }

        addInterruptible(interruptible: InterruptibleSpecBuilder): void {
            this.interruptibles.push(interruptible)
        }

        addDetectionInterruptible(interruptible: InterruptibleSpecBuilder): void {
            this.detectionInterruptibles.push(interruptible)
        }

        build(): SectionSpec {
            return new SectionSpec(
                this.parts.map(p => p instanceof SectionBuilder ? p.build() : p),
                this.interruptibles.map(i => i.build()),
                this.detectionInterruptibles.map(i => i.build()),
                this.cancelSection?.build()
            )
        }
    }
}
