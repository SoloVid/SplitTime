namespace splitTime.conversation {
    export class ConversationHandlers {
        private onInteractLambda = () => this.onInteract()
        private isTornDown = false

        constructor(
            private readonly conversation: ConversationInstance,
            private readonly nodeId: BreadCrumbs,
            private readonly section: SectionSpec,
            private readonly helper: RunnerHelper
        ) {}

        onInteract(): void {
            this.conversation.tryInterrupt(this.nodeId)
        }

        setUp(): void {
            // FTODO: Try to push this up the chain so that we don't attach and detach so often
            for (const speaker of this.section.getSpeakers()) {
                speaker.body.registerPlayerInteractHandler(this.onInteractLambda)
                if(this.section.detectionInterruptibles.length > 0) {
                    speaker.body.registerTimeAdvanceListener(
                        this.makeDetectionListener(speaker.body, this.section.detectionInterruptibles)
                    )
                }
            }
        }

        tearDown(): void {
            for (const speaker of this.section.getSpeakers()) {
                speaker.body.deregisterPlayerInteractHandler(this.onInteractLambda)
            }
            this.isTornDown = true
        }

        private makeDetectionListener(detective: Body, interruptibles: readonly InterruptibleSpec[]): (delta: number) => "SC" | undefined {
            return (delta: number) => {
                if (this.isTornDown) {
                    return SLVD.STOP_CALLBACKS
                }
                for(const interruptible of interruptibles) {
                    if(this.isDetectionInterruptibleTriggered(detective, interruptible)) {
                        this.conversation.interrupt(this.nodeId, interruptible)
                        return
                    }
                }
                return
            }
        }

        private isDetectionInterruptibleTriggered(detective: Body, interruptible: InterruptibleSpec): boolean {
            const actualTarget =
            interruptible.body ||
            this.helper.playerBodyGetter()
            return !!actualTarget &&
                splitTime.body.canDetect(
                    detective,
                    actualTarget
                ) &&
                interruptible.conditionMet
        }
    }
}
