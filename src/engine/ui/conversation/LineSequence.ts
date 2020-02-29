namespace SplitTime.conversation {
    /**
     * This class is meant to be a cheap Section that only holds Lines.
     * The purpose is to allow the conversation tree stack to index into groups of lines
     * in order to ameliorate the impact of insertion or removal of individual dialog lines
     * on save/load.
     */
    export class LineSequence {
        constructor(
            public readonly lines: readonly Line[],
            private readonly parent: SectionSpec
        ) {
            for(const line of this.lines) {
                line.setParent(this)
            }
        }

        getParent(): SectionSpec {
            return this.parent
        }
    }
}
