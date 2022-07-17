namespace splitTime.conversation {
    export class SpeechBubbleContentsSpec {
        private parent: LineSequence | null = null

        constructor(
            public readonly speaker: Speaker | null,
            public readonly parts: readonly TextPart[],
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

    export function makeSimpleLine(speaker: Speaker | null, line: string, options?: Partial<Options>) {
        return new SpeechBubbleContentsSpec(speaker, [{text: line}], options)
    }
}
