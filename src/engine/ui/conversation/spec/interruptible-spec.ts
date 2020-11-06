namespace splitTime.conversation {
    export class InterruptibleSpec {
        private parent: SectionSpec | null = null

        constructor(
            public readonly events: body.CustomEventHandler<void>[],
            public readonly condition: Condition,
            public readonly section: SectionSpec | null = null,
            public readonly body?: Body
        ) {}

        setParent(parent: SectionSpec): void {
            assert(this.parent === null, "LineSequence parent can only be set once")
            this.parent = parent
            if(this.section !== null) {
                this.section.setParent(parent)
            }
        }

        getParent(): SectionSpec {
            assert(this.parent !== null, "LineSequence parent should have been set")
            return this.parent!
        }

        // TODO: should this method be in here?
        get conditionMet(): boolean {
            if (typeof this.condition === "function") {
                return this.condition()
            } else if (this.condition === true) {
                return true
            } else {
                // TODO: add in mappy thing
                return false
            }
        }
    }
}
