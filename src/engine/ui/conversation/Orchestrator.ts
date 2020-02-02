namespace SplitTime.conversation {
    export class Orchestrator {
        constructor(
            private readonly manager: Manager,
            private readonly playerBodyGetter: () => Body | null
        ) {}

        start(setup: (d: DSL) => any): void {
            const topLevelSection = new Section(null)
            const orchestrationHelper = new OrchestrationHelper(
                this.manager,
                this.playerBodyGetter,
                topLevelSection
            )
            setup(orchestrationHelper)
            topLevelSection.run()
        }
    }
}
