namespace SplitTime.conversation {
    export class SectionReturn implements SectionChain {
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

        interruptibleByDetection(body: Body, condition: any = true, callback: Function = () => {}): SectionReturn {
            // FTODO: don't duplicate with above
            const parentSection = this.section.parentSection as Section;
            const interruptible = new Interruptible(condition, callback, body);
            const interruptibleSection = new Section(parentSection, this.helper, () => {
                if(interruptible.triggered) {
                    interruptible.runCallback();
                }
            });
            this.section.detectionInterruptibles.push(interruptible);
            parentSection.parts.push(interruptibleSection)
            return this;
        }

        then(callback: (result: Outcome) => any): Promise<Outcome> {
            return this.section.then(async result2 => {
                const newSection = new Section(this.section.parentSection, this.helper, () => {
                    callback(result2);
                });
                return await newSection.run();
            });
        }
    }
}