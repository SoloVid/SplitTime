namespace SplitTime.conversation {
    interface Runnable {
        run(): PromiseLike<outcome_t>
    }

    export class Section {
        public readonly clique: Clique
        private readonly localSpeakers: Speaker[] = []
        private readonly parts: Runnable[] = []
        private partRunningIndex: int = -1
        private cancelSection: Section | null = null
        private interruptibles: Interruptible[] = []
        private detectionInterruptibles: Interruptible[] = []
        private selfInterruptTriggered: boolean = false
        private followUpSection: Section | null = null

        constructor(public readonly parentSection: Section | null) {
            this.clique =
                this.parentSection === null
                    ? new Clique()
                    : this.parentSection.clique
        }

        dontAllowModifyWhileRunning() {
            if (this.partRunningIndex >= 0) {
                throw new Error(
                    "Conversation should not be modified after started"
                )
            }
        }

        append(part: Runnable) {
            this.dontAllowModifyWhileRunning()
            this.parts.push(part)
            if (part instanceof Line) {
                if (this.localSpeakers.indexOf(part.speaker) < 0) {
                    this.localSpeakers.push(part.speaker)
                }
            }
        }

        setCancelSection(section: Section) {
            this.dontAllowModifyWhileRunning()
            this.cancelSection = section
        }

        addInterruptible(interruptible: Interruptible) {
            this.dontAllowModifyWhileRunning()
            this.interruptibles.push(interruptible)
        }

        addDetectionInterruptible(interruptible: Interruptible) {
            this.dontAllowModifyWhileRunning()
            this.detectionInterruptibles.push(interruptible)
        }

        getSpeakers(): Speaker[] {
            const speakers = this.localSpeakers.slice()
            if (this.parentSection) {
                for (const speaker of this.parentSection.getSpeakers()) {
                    if (speakers.indexOf(speaker) < 0) {
                        speakers.push(speaker)
                    }
                }
            }
            return speakers
        }

        isCancelable(): boolean {
            return !!this.cancelSection || !!this.parentSection?.isCancelable()
        }

        isInterruptTriggered(): boolean {
            return (
                this.selfInterruptTriggered ||
                !!this.parentSection?.isInterruptTriggered()
            )
        }

        triggerInterrupt(): boolean {
            for (const interruptible of this.interruptibles) {
                if (interruptible.conditionMet) {
                    interruptible.trigger()
                    this.selfInterruptTriggered = true
                    this.followUpSection = interruptible.section
                    return true
                }
            }
            if (this.parentSection !== null) {
                return this.parentSection.triggerInterrupt()
            }
            return false
        }

        triggerInterruptByDetection(interruptible: Interruptible): boolean {
            if (
                this.detectionInterruptibles.indexOf(interruptible) >= 0 &&
                interruptible.conditionMet
            ) {
                interruptible.trigger()
                this.selfInterruptTriggered = true
                this.followUpSection = interruptible.section
                return true
            }
            if (this.parentSection !== null) {
                return this.parentSection.triggerInterruptByDetection(
                    interruptible
                )
            }
            return false
        }

        forEachDetectionInteruptible(
            callback: (interruptible: Interruptible) => void
        ) {
            for (const interruptible of this.detectionInterruptibles) {
                callback(interruptible)
            }
            if (this.parentSection !== null) {
                this.parentSection.forEachDetectionInteruptible(callback)
            }
        }

        async run(): Promise<outcome_t> {
            let sectionOutcome: outcome_t = {
                canceled: false,
                interrupted: false
            }

            for (const part of this.parts) {
                this.partRunningIndex++
                const outcome = await part.run()
                if (outcome.canceled && this.isCancelable()) {
                    sectionOutcome.canceled = true
                    this.followUpSection = this.cancelSection
                }
                if (this.followUpSection) {
                    await this.followUpSection.run()
                    break
                }
            }

            return sectionOutcome
        }
    }
}
