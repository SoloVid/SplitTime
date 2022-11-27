import { Immutable } from "engine/utils/immutable"
import { BodyRenderingGraph } from "engine/world/body/body-rendering-graph"
import { useMemo } from "preact/hooks"
import { EditorEntity, EntityBodyManager } from "./entity-body-manager"

export function useSortedEntities(
  entities: readonly Immutable<EditorEntity>[],
  bodyManager: EntityBodyManager,
) {
  return useMemo(() => {
    // We instantiate these in here rather than as class members
    // because it prevents Vue from tracking all of the internals (extra overhead)
    const graph = new BodyRenderingGraph()
    const bodyRefToEntity: { [bodyRef: number]: EditorEntity } = {}
    graph.notifyNewFrame()
    for (const entity of entities) {
      const body = bodyManager.getUpdatedBody(entity)
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
  }, [entities, bodyManager])
}
