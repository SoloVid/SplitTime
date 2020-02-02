namespace SplitTime.conversation {
    export class LineRunner {
        private readonly dialog: SpeechBubble
        private readonly outcome: outcome_t
        private readonly speakers: Speaker[]
        private started: boolean = false
        private done: boolean = false
        private readonly promise: SLVD.Promise = new SLVD.Promise()
        constructor(
            private readonly parentSection: Section,
            private readonly helper: OrchestrationHelper,
            private readonly line: Line
        ) {
            this.dialog = new SpeechBubble(
                this.parentSection.clique,
                this.line.speaker.name,
                this.line.line,
                this.line.speaker.speechBox
            )
            this.outcome = {
                canceled: false,
                interrupted: true
            }
            this.speakers = this.parentSection.getSpeakers()
        }

        private onInteract() {
            if (this.parentSection.triggerInterrupt()) {
                this.outcome.interrupted = true
                this.dialog.cutOff()
            } else {
                this.dialog.advance()
            }
        }

        private onDismiss() {
            if (this.parentSection.isCancelable()) {
                this.outcome.canceled = true
                // TODO: keep or remove?
                this.resolve()
                this.helper.manager.remove(this.dialog)
            }
        }

        private resolve() {
            this.promise.resolve(this.outcome)
            this.deregisterHandlers()
        }

        private registerHandlers() {
            // FTODO: Try to push this up the chain so that we don't attach and detach so often
            for (const speaker of this.speakers) {
                speaker.body.registerPlayerInteractHandler(() =>
                    this.onInteract()
                )
                // FTODO: refactor
                this.parentSection.forEachDetectionInteruptible(
                    interruptible => {
                        speaker.body.registerTimeAdvanceListener(
                            ((detective, interruptible) => {
                                return (delta: number) => {
                                    if (this.promise.resolved) {
                                        return SLVD.STOP_CALLBACKS
                                    }
                                    const actualTarget =
                                        interruptible.body ||
                                        this.helper.playerBodyGetter()
                                    if (
                                        actualTarget &&
                                        SplitTime.body.canDetect(
                                            detective,
                                            actualTarget
                                        )
                                    ) {
                                        if (
                                            this.parentSection.triggerInterruptByDetection(
                                                interruptible
                                            )
                                        ) {
                                            this.outcome.interrupted = true
                                            this.dialog.cutOff()
                                        }
                                    }
                                    return
                                }
                            })(speaker.body, interruptible)
                        )
                    }
                )
            }
            this.dialog.registerPlayerInteractHandler(() => this.onInteract())
            this.dialog.registerDismissHandler(() => this.onDismiss())
            this.dialog.registerDialogEndHandler(() => this.resolve())
        }

        private deregisterHandlers() {
            for (const speaker of this.speakers) {
                speaker.body.deregisterPlayerInteractHandler(() =>
                    this.onInteract()
                )
            }
        }

        run(): PromiseLike<outcome_t> {
            if (this.started) {
                throw new Error("LineRunner already started!")
            }
            this.started = true
            // FTODO: make this a bit more object oriented
            this.registerHandlers()
            this.dialog.clique.speakers = this.speakers
            this.helper.manager.submit(this.dialog)
            return this.promise
        }
    }
}
