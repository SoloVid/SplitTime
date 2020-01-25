namespace SplitTime.conversation {
    export class Section {
        conversation: Clique;
        parts: (Line | Section)[] = [];
        nextPartToRunIndex: int = 0;
        markedCancelable: boolean = false;
        interruptibles: Interruptible[] = [];
        detectionInterruptibles: Interruptible[] = [];
        selfInterruptTriggered: boolean = false;
        promise: Promise<Outcome>;
        resolve: (value?: Outcome | PromiseLike<Outcome>) => void = () => {};

        constructor(public readonly parentSection: Section | null, private readonly helper: OrchestrationHelper, private readonly setup: Function) {
            this.conversation = this.parentSection === null ? new Clique() : this.parentSection.conversation;

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

        triggerInterruptByDetection(body: Body): boolean {
            for(const interruptible of this.detectionInterruptibles) {
                if(body === interruptible.body && interruptible.conditionMet) {
                    interruptible.trigger();
                    this.selfInterruptTriggered = true;
                    return true;
                }
            }
            if(this.parentSection !== null) {
                return this.parentSection.triggerInterruptByDetection(body);
            }
            return false;
        }

        async run(): Promise<Outcome> {
            const previousConversationSpeakers = this.conversation.speakers.slice();
            const previousSection = this.helper._parentSection;
            let sectionOutcome: Outcome = new Outcome();
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

        then(callback: (value: Outcome) => Outcome | PromiseLike<Outcome>): Promise<Outcome> {
            return this.promise.then(callback);
        }
    }
}