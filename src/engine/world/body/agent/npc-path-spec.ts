namespace splitTime.agent {
    export class NpcPathSpec implements Runnable<ObjectCallbacks<void>> {
        constructor(
            public readonly id: string,
            public readonly setup: SetupFunc,
            private readonly npc: Npc,
            private readonly manager: PathSpecManager
        ) {
        }

        run(): ObjectCallbacks<void> {
            return this.manager.start(this, this.npc)
        }
    }
}