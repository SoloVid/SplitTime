namespace splitTime.conversation {
    // FTODO: Get rid of singleton
    export const interactEvent = new splitTime.body.CustomEventHandler<void>()
    export class ConversationHandlers {
        private readonly onInteractLambda = () => this.onInteract()
        onInteract = () => this.onInteractDefault()
        private isTornDown = false

        constructor(
            private readonly conversation: ConversationInstance,
            private readonly node: ConversationLeafNode,
            private readonly section: SectionSpec,
            private readonly helper: RunnerHelper
        ) {}

        private onInteractDefault(): void {
            this.conversation.tryInterrupt("TODO: type", this.node)
        }

        setUp(): void {
            // FTODO: Try to push this up the chain so that we don't attach and detach so often
            for (const speaker of this.section.getSpeakers()) {
                interactEvent.registerListener(speaker.body, this.onInteractLambda)
                if(this.section.detectionInterruptibles.length > 0) {
                    speaker.body.registerTimeAdvanceListener(
                        this.makeDetectionListener(speaker.body, this.section.detectionInterruptibles)
                    )
                }
            }
        }

        tearDown(): void {
            for (const speaker of this.section.getSpeakers()) {
                interactEvent.removeListener(speaker.body, this.onInteractLambda)
            }
            this.isTornDown = true
        }

        private makeDetectionListener(detective: Body, interruptibles: readonly InterruptibleSpec[]): (delta: number) => STOP_CALLBACKS_TYPE | undefined {
            return (delta: number) => {
                if (this.isTornDown) {
                    return splitTime.STOP_CALLBACKS
                }
                for(const interruptible of interruptibles) {
                    if(this.isDetectionInterruptibleTriggered(detective, interruptible)) {
                        this.conversation.interrupt(this.node, interruptible)
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
