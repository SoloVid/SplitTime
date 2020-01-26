namespace SplitTime.conversation {
    export class OrchestrationHelper implements DSL {
        _parentSection: Section | null = null;

        constructor(public readonly manager: Manager) {}

        get parentSection(): Section {
            if(!this._parentSection) {
                throw new Error("No conversation context available");
            }
            return this._parentSection;
        }

        set parentSection(section: Section) {
            this._parentSection = section;
        }

        say(speaker: Speaker, line: string): Promise<Outcome> {
            if(this.parentSection.clique.speakers.indexOf(speaker) < 0) {
                this.parentSection.clique.speakers.push(speaker);
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
}