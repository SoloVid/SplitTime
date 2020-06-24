namespace splitTime.agent {
    export class PathSpecManager {
        private specs: { [id: string]: PathSpec } = {}

        register(id: string, setup: SetupFunc, npc: Npc): NpcPathSpec
        register(id: string, setup: SetupFunc): PathSpec
        register(id: string, setup: SetupFunc, npc?: Npc): PathSpec {
            const spec = npc === undefined ? new PathSpec(id, setup) : new NpcPathSpec(id, setup, npc, this)
            this.specs[id] = spec
            return spec
        }

        getSpecById(id: string): PathSpec {
            const spec = this.specs[id]
            assert(!!spec, "Path spec \"" + id + "\" not found")
            return spec
        }

        start(spec: PathSpec, npc: Npc): ObjectCallbacks<void> {
            const pathWalker = new PathWalker(npc, spec)
            pathWalker.start()
            return pathWalker.waitForComplete()
        }
    }
}