namespace SplitTime.conversation {
    export class Orchestrator {
        constructor(private readonly manager: Manager, private readonly playerBodyGetter: () => Body | null) {

        }

        start(orchestrator: (d: DSL) => any): Promise<Outcome> {
            const orchestrationHelper = new OrchestrationHelper(this.manager, this.playerBodyGetter);
            const topLevelSection = new Section(null, orchestrationHelper, () => {
                orchestrator(orchestrationHelper);
            });
            return Promise.resolve().then(() => { return topLevelSection.run(); });
        }

        startCancelable(orchestrator: (d: DSL) => any): Promise<Outcome> {
            return this.start(d => {
                d.cancelable(() => {
                    orchestrator(d);
                })
            });
        }
    
        startInterruptible(orchestrator: (d: DSL) => any): Promise<Outcome> {
            return this.start(d => {
                d.section(() => {
                    orchestrator(d);
                }).interruptible();
            });
        }
    }
}
