namespace splitTime.conversation {
    export class Line {
        private parent: LineSequence | null = null

        constructor(
            public readonly speaker: Speaker | null,
            public readonly text: string,
            public readonly options?: Partial<Options>
        ) {}

        setParent(parent: LineSequence): void {
            assert(this.parent === null, "Line parent can only be set once")
            this.parent = parent
        }

        getParent(): LineSequence {
            assert(this.parent !== null, "Line parent should have been set")
            return this.parent
        }
    }
}
