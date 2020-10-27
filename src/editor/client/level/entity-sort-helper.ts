namespace splitTime.editor.level {
    export class EntitySortHelper {

        private readonly graph = new body.BodyRenderingGraph()
        private readonly bodyRefToEntity: { [bodyRef: number]: EditorEntity } = {}

        constructor(
            private readonly level: Level,
            private readonly bodyManager: EntityBodyManager
        ) {}

        getSortedEntities(): EditorEntity[] {
            this.graph.notifyNewFrame()
            let entities: EditorEntity[] = []
            entities = entities.concat(this.level.positions)
            entities = entities.concat(this.level.props)
            entities = entities.concat(this.level.traces)
            for (const entity of entities) {
                const body = this.bodyManager.getUpdatedBody(entity)
                if (body !== null) {
                    this.bodyRefToEntity[body.ref] = entity
                    this.graph.feedBody(body)
                }
            }
            this.graph.rebuildGraph()
            const sorted: EditorEntity[] = []
            this.graph.walk(node => {
                const entity = this.bodyRefToEntity[node.body.ref]
                sorted.push(entity)
            })
            return sorted
        }
    }
}