namespace splitTime.editor.level {
    export class EntitySortHelper {

        // private readonly graph = new body.BodyRenderingGraph()
        // private readonly editorIdToBody: { [editorId: string]: Body } = {}
        // private readonly nodeRefToEntity: { [nodeRef: number]: (Position | Prop) } = {}

        constructor(private readonly level: Level) {}

        getSortedEntities(): (Position | Prop | Trace)[] {
            let entities: (Position | Prop | Trace)[] = []
            entities = entities.concat(this.level.positions)
            entities = entities.concat(this.level.props)
            entities = entities.concat(this.level.traces)
            entities.sort((a, b) => {
                if (a.obj.z !== b.obj.z) {
                    return a.obj.z - b.obj.z
                }
                if (a.type === "trace" && b.type === "trace") {
                    return a.obj.height - b.obj.height
                } else if (a.type === "trace") {
                    // FTODO: Can we do better here?
                    return a.obj.height - DEFAULT_HEIGHT
                } else if (b.type === "trace") {
                    // FTODO: Can we do better here?
                    return b.obj.height - DEFAULT_HEIGHT
                }
                return a.obj.y - b.obj.y
            })
            return entities
            // this.graph.notifyNewFrame()
            // for (const position of this.level.positions) {
            //     if (!(position.metadata.editorId in this.editorIdToBody)) {
            //         this.editorIdToBody[position.metadata.editorId] = new Body()
            //     }
            //     const body = this.editorIdToBody[position.metadata.editorId]
            //     body.x = position.obj.x
            //     body.y = position.obj.y
            //     body.z = position.obj.y
            //     const collage = 
            //     this.graph.feedBody(...)
            // }
            // for (const prop of this.level.props) {
            //     this.graph.feedBody(...)
            // }
            
            // this.graph.rebuildGraph()
            // const sorted: (Position | Prop)[] = []
            // this.graph.walk(node => {
            //     sorted.push(...)
            // })
        }
    }
}