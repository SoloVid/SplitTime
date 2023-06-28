import { Immutable } from "engine/utils/immutable"
import { BodyRenderingGraph } from "engine/world/body/body-rendering-graph"
import { useMemo, useState } from "preact/hooks"
import { EditorGraphBody } from "./entity-body-manager"
import { EditorEntityWithType, EditorPosition, EditorProp, EditorTrace } from "./extended-level-format"

export function useSortedEntities(
  entities: readonly Immutable<EditorEntityWithType>[],
  bodies: readonly Immutable<EditorGraphBody>[],
) {
  const [graph] = useState(new BodyRenderingGraph())
  return useMemo(() => {
    // console.log("rebuilding graph")
    graph.notifyNewFrame()
    for (const b of bodies) {
      graph.feedBody(b)
    }
    graph.rebuildGraph()
    let order = 0
    const editorIdOrderMap: Record<string, number> = {}
    graph.walk(node => {
      const editorGraphBody = node.body as EditorGraphBody
      editorIdOrderMap[editorGraphBody.editorId] = order++
    })
    const sortedEntities: Immutable<EditorEntityWithType>[] = new Array(entities.length)
    let unsortedPosition = entities.length - 1
    for (const e of entities) {
      const position = editorIdOrderMap[e.e.id] ?? unsortedPosition--
      sortedEntities[position] = e
    }
    return sortedEntities
    // return [...entities].sort((a, b) => editorIdOrderMap[a.metadata.editorId] - editorIdOrderMap[b.metadata.editorId])
  }, [entities, bodies])
}
