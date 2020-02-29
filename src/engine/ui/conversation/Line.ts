namespace SplitTime.conversation {
    export class Line {
        private parent: LineSequence | null = null

        constructor(
            public readonly speaker: Speaker,
            public readonly text: string
        ) {}

        setParent(parent: LineSequence): void {
            assert(this.parent === null, "Line parent can only be set once")
            this.parent = parent
        }

        getParent(): SectionSpec {
            assert(this.parent !== null, "Line parent should have been set")
            return this.parent!.getParent()
        }
    }
}
