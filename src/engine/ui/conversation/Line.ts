namespace SplitTime.conversation {
    type DialogOutcomeHandler = (result: Outcome) => any;

    export class Line {
        private initialSpeakers: Speaker[] = [];

        constructor(private readonly parentSection: Section, private readonly helper: OrchestrationHelper, public readonly speaker: Speaker, public readonly line: string, public readonly callback: DialogOutcomeHandler) {
            this.initialSpeakers = this.parentSection.conversation.speakers.slice();
        }

        run(): Promise<Outcome> {
            return new Promise((resolve, reject) => {
                const dialog = new SpeechBubble(this.parentSection.conversation, this.speaker.name, this.line, this.speaker.speechBox);
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
                for(const speaker of this.parentSection.conversation.speakers) {
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
                    for(const interruptible of this.parentSection.detectionInterruptibles) {
                        if(interruptible.body) {
                            speaker.body.registerTimeAdvanceListener(((detective, target) => {
                                return (delta: number) => {
                                    if(done) {
                                        return SLVD.STOP_CALLBACKS;
                                    }
                                    if(SplitTime.body.canDetect(detective, target)) {
                                        if(this.parentSection.triggerInterruptByDetection(target)) {
                                            interrupted = true;
                                            dialog.cutOff();
                                        }
                                    }
                                    return;
                                };
                            })(speaker.body, interruptible.body));
                        }
                    }
                }
                dialog.registerPlayerInteractHandler(onInteract);
                dialog.registerDismissHandler(onDismiss);
                dialog.registerDialogEndHandler(resolveWithCleanup);
                this.helper.manager.submit(dialog);
            });
        }
    }
}