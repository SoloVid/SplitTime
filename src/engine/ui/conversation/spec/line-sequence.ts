namespace splitTime.conversation {
    /**
     * This class is meant to be a cheap Section that only holds Lines.
     * The purpose is to allow the conversation tree stack to index into groups of lines
     * in order to ameliorate the impact of insertion or removal of individual dialog lines
     * on save/load.
     */
    export class LineSequence {
        private parent: SectionSpec | null = null

        constructor(
            public readonly lines: readonly SpeechBubbleContentsSpec[]
        ) {
            for(const line of this.lines) {
                line.setParent(this)
            }
        }

        setParent(parent: SectionSpec): void {
            assert(this.parent === null, "LineSequence parent can only be set once")
            this.parent = parent
        }

        getParent(): SectionSpec {
            assert(this.parent !== null, "LineSequence parent should have been set")
            return this.parent
        }
    }
}
