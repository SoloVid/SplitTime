namespace SplitTime.dialog {
    export function start(orchestrator: (d: OrchestrationHelper) => any): Promise<DialogOutcome> {
        const orchestrationHelper = new OrchestrationHelper();
        const topLevelSection = new Section(null, orchestrationHelper, () => {
            orchestrator(orchestrationHelper);
        });
        return Promise.resolve().then(() => { return topLevelSection.run(); });
    }

    export function startCancelable(orchestrator: (d: OrchestrationHelper) => any): Promise<DialogOutcome> {
        return start(d => {
            d.cancelable(() => {
                orchestrator(d);
            })
        });
    }

    export function startInterruptible(orchestrator: (d: OrchestrationHelper) => any): Promise<DialogOutcome> {
        return start(d => {
            d.section(() => {
                orchestrator(d);
            }).interruptible();
        });
    }

    type DialogOutcomeHandler = (result: DialogOutcome) => any;

    class Section implements Runnable {
        conversation: Conversation;
        parts: Runnable[] = [];
        nextPartToRunIndex: int = 0;
        markedCancelable: boolean = false;
        interruptibles: Interruptible[] = [];
        selfInterruptTriggered: boolean = false;
        promise: Promise<DialogOutcome>;
        resolve: (value?: DialogOutcome | PromiseLike<DialogOutcome>) => void = () => {};

        constructor(public readonly parentSection: Section | null, private readonly helper: OrchestrationHelper, private readonly setup: Function) {
            this.conversation = this.parentSection === null ? new Conversation() : this.parentSection.conversation;

            this.promise = new Promise(resolve => {
                this.resolve = resolve;
            });
        }

        get cancelable(): boolean {
            if(this.parentSection == null) {
                return this.markedCancelable;
            }
            return this.markedCancelable || this.parentSection.cancelable;
        }

        get interruptTriggered(): boolean {
            if(this.parentSection == null) {
                return this.selfInterruptTriggered;
            }
            return this.selfInterruptTriggered || this.parentSection.interruptTriggered;
        }

        triggerInterrupt(): boolean {
            for(const interruptible of this.interruptibles) {
                if(interruptible.conditionMet) {
                    interruptible.trigger();
                    this.selfInterruptTriggered = true;
                    return true;
                }
            }
            if(this.parentSection !== null) {
                return this.parentSection.triggerInterrupt();
            }
            return false;
        }

        async run(): Promise<DialogOutcome> {
            const previousConversationSpeakers = this.conversation.speakers.slice();
            const previousSection = this.helper._parentSection;
            let sectionOutcome: DialogOutcome = new DialogOutcome();
            try {
                this.helper.parentSection = this;
                this.setup();

                while(this.nextPartToRunIndex != this.parts.length) {
                    const outcome = await this.parts[this.nextPartToRunIndex++].run();
                    if((outcome.canceled && this.cancelable) || (outcome.interrupted && this.interruptTriggered)) {
                        sectionOutcome = outcome;
                        break;
                    }
                }
            } finally {
                this.helper._parentSection = previousSection;
                this.conversation.speakers = previousConversationSpeakers;
            }
            // FTODO: address warning here
            await this.resolve(sectionOutcome);
            return sectionOutcome;
        }

        then(callback: (value: DialogOutcome) => DialogOutcome | PromiseLike<DialogOutcome>): Promise<DialogOutcome> {
            return this.promise.then(callback);
        }
    }

    class Line implements Runnable {
        private initialSpeakers: Speaker[] = [];

        constructor(private readonly parentSection: Section, private readonly helper: OrchestrationHelper, public readonly speaker: Speaker, public readonly line: string, public readonly callback: DialogOutcomeHandler) {
            this.initialSpeakers = this.parentSection.conversation.speakers.slice();
        }

        run(): Promise<DialogOutcome> {
            return new Promise((resolve, reject) => {
                const dialog = new SplitTime.dialog.SpeechBubble(this.parentSection.conversation, this.speaker.name, this.line, this.speaker.speechBox);
                let interrupted = true;
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
                        dialog.close();
                    }
                };
                const speakers = this.initialSpeakers.slice();
                for(const speaker of this.parentSection.conversation.speakers) {
                    if(speakers.indexOf(speaker) < 0) {
                        speakers.push(speaker);
                    }
                }
                const resolveWithCleanup = () => {
                    const outcome = new DialogOutcome(canceled, interrupted);
                    this.callback(outcome);
                    resolve(outcome);
                    for(const speaker of speakers) {
                        speaker.body.deregisterPlayerInteractHandler(onInteract);
                    }
                };

                // FTODO: Try to push this up the chain so that we don't attach and detach so often
                for(const speaker of speakers) {
                    speaker.body.registerPlayerInteractHandler(onInteract);
                }
                dialog.registerPlayerInteractHandler(onInteract);
                dialog.registerDismissHandler(onDismiss);
                dialog.registerDialogEndHandler(resolveWithCleanup);
                dialog.start();
            });
        }
    }

    interface Runnable {
        run(): Promise<DialogOutcome>;
    }

    export interface DSL {
        say(speaker: Speaker, line: string): Promise<DialogOutcome>;
        section(setup: Function): SectionReturn;
        cancelable(setup: Function): SectionReturn;
    }

    class OrchestrationHelper implements DSL {
        _parentSection: Section | null = null;

        get parentSection(): Section {
            if(!this._parentSection) {
                throw new Error("No conversation context available");
            }
            return this._parentSection;
        }

        set parentSection(section: Section) {
            this._parentSection = section;
        }

        say(speaker: Speaker, line: string): Promise<DialogOutcome> {
            if(this.parentSection.conversation.speakers.indexOf(speaker) < 0) {
                this.parentSection.conversation.speakers.push(speaker);
            }
            return new Promise((resolve, reject) => {
                this.parentSection.parts.push(new Line(this.parentSection, this, speaker, line, resolve));
            });
        }

        section(setup: Function): SectionReturn {
            const newSection = new Section(this.parentSection, this, setup);
            this.parentSection.parts.push(newSection);
            return new SectionReturn(newSection, this);
        }

        cancelable(setup: Function): SectionReturn {
            return this.section(setup).cancelable();
        }
    }

    class DialogOutcome {
        constructor(private _canceled = false, private _interrupted = false) {

        }

        get canceled(): boolean {
            return this._canceled;
        }
        get interrupted(): boolean {
            return this._interrupted;
        }
    }

    class SectionReturn {
        constructor(private section: Section, private helper: OrchestrationHelper) {

        }

        cancelable(): SectionReturn {
            this.section.markedCancelable = true;
            return this;
        }

        interruptible(condition: any = true, callback: Function = () => {}): SectionReturn {
            // FTODO: make this less hacky (reaching into parent section of section)
            const parentSection = this.section.parentSection as Section;
            const interruptible = new Interruptible(condition, callback);
            const interruptibleSection = new Section(parentSection, this.helper, () => {
                if(interruptible.triggered) {
                    interruptible.runCallback();
                }
            });
            this.section.interruptibles.push(interruptible);
            parentSection.parts.push(interruptibleSection)
            return this;
        }

        then(callback: (result: DialogOutcome) => any): Promise<DialogOutcome> {
            return this.section.then(async result2 => {
                const newSection = new Section(this.section.parentSection, this.helper, () => {
                    callback(result2);
                });
                return await newSection.run();
            });
        }
    }

    class Interruptible {
        private _triggered: boolean = false;

        constructor(private condition: any, private callback: Function) {

        }

        get triggered(): boolean {
            return this._triggered;
        }

        get conditionMet(): boolean {
            if(typeof this.condition === "function") {
                return this.condition();
            } else if(this.condition === true) {
                return true;
            } else {
                // TODO: add in mappy thing
                return false;
            }
        }

        trigger(): void {
            this._triggered = true;
        }

        runCallback(): void {
            this.callback();
        }
    }
}
