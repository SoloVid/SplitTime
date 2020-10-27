namespace splitTime.editor.level {
    export class EntitySortHelper {

        constructor(
            private readonly level: Level,
            private readonly bodyManager: EntityBodyManager
        ) {}

        getSortedEntities(): EditorEntity[] {
            // We instantiate these in here rather than as class members
            // because it prevents Vue from tracking all of the internals (extra overhead)
            const graph = new body.BodyRenderingGraph()
            const bodyRefToEntity: { [bodyRef: number]: EditorEntity } = {}
            graph.notifyNewFrame()
            let entities: EditorEntity[] = []
            entities = entities.concat(this.level.positions)
            entities = entities.concat(this.level.props)
            entities = entities.concat(this.level.traces)
            for (const entity of entities) {
                const body = this.bodyManager.getUpdatedBody(entity)
                if (body !== null) {
                    bodyRefToEntity[body.ref] = entity
                    graph.feedBody(body)
                }
            }
            graph.rebuildGraph()
            const sorted: EditorEntity[] = []
            graph.walk(node => {
                const entity = bodyRefToEntity[node.body.ref]
                sorted.push(entity)
            })
            return sorted
        }
    }
}