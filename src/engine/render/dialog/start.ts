namespace SplitTime.dialog {
    export function start(orchestrator: (d: OrchestrationHelper) => any): Promise<DialogOutcome> {
        const orchestrationHelper = new OrchestrationHelper();
        const topLevelSection = new Section(null, orchestrationHelper, () => {
            orchestrator(orchestrationHelper);
        });
        return Promise.resolve().then(() => { return topLevelSection.run(); });
    }

    type DialogOutcomeHandler = (result: DialogOutcome) => any;

    class Section implements Runnable {
        parts: Runnable[] = [];
        nextPartToRunIndex: int = 0;
        markedCancelable: boolean = false;
        interruptibles: Interruptible[] = [];
        selfInterruptTriggered: boolean = false;
        promise: Promise<DialogOutcome>;
        resolve: (value?: DialogOutcome | PromiseLike<DialogOutcome>) => void;

        constructor(public readonly parentSection: Section | null, private readonly helper: OrchestrationHelper, private readonly setup: Function) {
            this.promise = new Promise((resolve, reject) => {
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
        }

        async run(): Promise<DialogOutcome> {
            const previousSection = this.helper.parentSection;
            try {
                this.helper.parentSection = this;
                this.setup();

                let sectionOutcome: DialogOutcome = new DialogOutcome();
                while(this.nextPartToRunIndex != this.parts.length) {
                    const outcome = await this.parts[this.nextPartToRunIndex++].run();
                    if((outcome.canceled && this.cancelable) || (outcome.interrupted && this.interruptTriggered)) {
                        sectionOutcome = outcome;
                        break;
                    }
                }
                await this.resolve(sectionOutcome);
                return sectionOutcome;
            } finally {
                this.helper.parentSection = previousSection;
            }
        }

        then(callback: (value: DialogOutcome) => DialogOutcome | PromiseLike<DialogOutcome>): Promise<DialogOutcome> {
            return this.promise.then(callback);
        }
    }

    class Line implements Runnable {

        constructor(private readonly parentSection: Section, private readonly helper: OrchestrationHelper, public readonly speaker: Speaker, public readonly line: string, public readonly callback: DialogOutcomeHandler) {

        }

        run(): Promise<DialogOutcome> {
            return new Promise((resolve, reject) => {
                const dialog = new SplitTime.Dialog(this.speaker.name, [this.line], this.speaker.speechBox);
                dialog.setAdvanceMethod(SplitTime.Dialog.AdvanceMethod.AUTO);

                const onInteract = () => {
                    if(this.parentSection.triggerInterrupt()) {
                        resolveWithCleanup(new DialogOutcome(false, true));
                        dialog.close();
                    }
                };
                const onDismiss = () => {
                    if(this.parentSection.cancelable) {
                        resolveWithCleanup(new DialogOutcome(true, false));
                        dialog.close();
                    }
                };
                const resolveWithCleanup = (outcome: DialogOutcome) => {
                    this.callback(outcome);
                    resolve(outcome);
                    this.speaker.body.deregisterPlayerInteractHandler(onInteract);
                };

                this.speaker.body.registerPlayerInteractHandler(onInteract);
                dialog.registerPlayerInteractHandler(onInteract);
                dialog.registerDismissHandler(onDismiss);
                dialog.registerDialogEndHandler(() => {
                    resolveWithCleanup(new DialogOutcome());
                });
                dialog.start();
            });
        }
    }

    interface Runnable {
        run(): Promise<DialogOutcome>;
    }

    class OrchestrationHelper {
        parentSection: Section;

        say(speaker: Speaker, line: string): Promise<DialogOutcome> {
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
            const interruptible = new Interruptible(condition, callback);
            const interruptibleSection = new Section(this.section.parentSection, this.helper, () => {
                if(interruptible.triggered) {
                    interruptible.runCallback();
                }
            });
            this.section.interruptibles.push(interruptible);
            this.section.parentSection.parts.push(interruptibleSection)
            return this;
        }

        then(callback: (result: DialogOutcome) => any): Promise<DialogOutcome> {
            return this.section.then(callback);
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
