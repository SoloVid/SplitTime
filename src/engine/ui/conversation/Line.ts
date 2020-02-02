namespace SplitTime.conversation {
    export class Line {
        constructor(
            private readonly parentSection: Section,
            private readonly helper: OrchestrationHelper,
            public readonly speaker: Speaker,
            public readonly line: string
        ) {}

        run(): PromiseLike<outcome_t> {
            const runner = new LineRunner(this.parentSection, this.helper, this)
            return runner.run()
        }
    }
}
