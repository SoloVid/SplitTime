namespace SplitTime.conversation {
    export class OrchestrationHelper implements DSL {
        private _section: Section

        constructor(
            public readonly manager: Manager,
            public readonly playerBodyGetter: () => Body | null,
            topLevelSection: Section
        ) {
            this._section = topLevelSection
        }

        say(speaker: Speaker, line: string): void {
            const lineObj = new Line(this._section, this, speaker, line)
            this._section.append(lineObj)
        }

        section(setup: () => void): SectionReturn {
            const newSection = new Section(this._section)
            this.withSection(newSection, setup)
            this._section.append(newSection)
            return new SectionReturn(newSection, this)
        }

        do(action: () => void): void {
            this._section.append(new SimpleRunnable(action))
        }

        waitUntil(condition: condition_t): void {
            this._section.append(new Wait(condition))
        }

        withSection(section: Section, callback: () => void): void {
            const prevSection = this._section
            try {
                this._section = section
                callback()
            } finally {
                this._section = prevSection
            }
        }
    }
}
