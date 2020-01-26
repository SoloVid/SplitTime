namespace SplitTime.conversation {
    type DialogOutcomeHandler = (result: Outcome) => any;

    export class Line {
        private initialSpeakers: Speaker[] = [];

        constructor(private readonly parentSection: Section, private readonly helper: OrchestrationHelper, public readonly speaker: Speaker, public readonly line: string, public readonly callback: DialogOutcomeHandler) {
            this.initialSpeakers = this.parentSection.clique.speakers.slice();
        }

        run(): Promise<Outcome> {
            return new Promise((resolve, reject) => {
                const dialog = new SpeechBubble(this.parentSection.clique, this.speaker.name, this.line, this.speaker.speechBox);
                let done = false;
                let interrupted = false;
                let canceled = false;
                const onInteract = () => {
                    if(this.parentSection.triggerInterrupt()) {
                        interrupted = true;
                        dialog.cutOff();
                    } else {
                        dialog.advance();
                    }
                };
                const onDismiss = () => {
                    if(this.parentSection.cancelable) {
                        canceled = true;
                        // TODO: keep or remove?
                        resolveWithCleanup();
                        this.helper.manager.remove(dialog);
                    }
                };
                const speakers = this.initialSpeakers.slice();
                for(const speaker of this.parentSection.clique.speakers) {
                    if(speakers.indexOf(speaker) < 0) {
                        speakers.push(speaker);
                    }
                }
                const resolveWithCleanup = () => {
                    const outcome = new Outcome(canceled, interrupted);
                    this.callback(outcome);
                    resolve(outcome);
                    for(const speaker of speakers) {
                        speaker.body.deregisterPlayerInteractHandler(onInteract);
                    }
                    done = true;
                };

                // FTODO: Try to push this up the chain so that we don't attach and detach so often
                for(const speaker of speakers) {
                    speaker.body.registerPlayerInteractHandler(onInteract);
                    // FTODO: refactor
                    this.parentSection.forEachDetectionInteruptible(interruptible => {
                        speaker.body.registerTimeAdvanceListener(((detective, interruptible) => {
                            return (delta: number) => {
                                if(done) {
                                    return SLVD.STOP_CALLBACKS;
                                }
                                const actualTarget = interruptible.body || this.helper.playerBodyGetter();
                                if(actualTarget && SplitTime.body.canDetect(detective, actualTarget)) {
                                    if(this.parentSection.triggerInterruptByDetection(interruptible)) {
                                        interrupted = true;
                                        dialog.cutOff();
                                    }
                                }
                                return;
                            };
                        })(speaker.body, interruptible));
                    });
                }
                dialog.registerPlayerInteractHandler(onInteract);
                dialog.registerDismissHandler(onDismiss);
                dialog.registerDialogEndHandler(resolveWithCleanup);
                this.helper.manager.submit(dialog);
            });
        }
    }
}