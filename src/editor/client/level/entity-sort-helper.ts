namespace splitTime.editor.level {
    export class EntitySortHelper {

        // private readonly graph = new body.BodyRenderingGraph()
        // private readonly editorIdToBody: { [editorId: string]: Body } = {}
        // private readonly nodeRefToEntity: { [nodeRef: number]: (Position | Prop) } = {}

        constructor(private readonly level: Level) {}

        getSortedEntities(): (Position | Prop)[] {
            let entities: (Position | Prop)[] = []
            entities = entities.concat(this.level.positions)
            entities = entities.concat(this.level.props)
            entities.sort((a, b) => {
                if (a.obj.z !== b.obj.z) {
                    return a.obj.z - b.obj.z
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