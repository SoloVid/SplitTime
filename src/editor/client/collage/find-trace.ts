import { Immutable } from "engine/utils/immutable";
import { FileCollage, FileTrace } from "../file-types";
import { ImmutableSetter } from "../utils/preact-help";

export function findTraceInCollage(collage: Immutable<FileCollage>, id: string): Immutable<FileTrace> | null {
  for (const montage of collage.montages) {
    for (const t of montage.traces) {
      if (t.id === id) {
        return t
      }
    }
  }
  return null
}

export function updateTraceInCollage(setCollage: ImmutableSetter<FileCollage>, traceId: string, transformTrace: (before: Immutable<FileTrace>) => Immutable<FileTrace>) {
  setCollage((beforeCollage) => {
    return {
      ...beforeCollage,
      montages: beforeCollage.montages.map(m => {
        if (!m.traces.some(t => t.id === traceId)) {
          return m
        }
        return {
          ...m,
          traces: m.traces.map(t => {
            if (t.id !== traceId) {
              return t
            }
            return transformTrace(t)
          })
        }
      })
    }
  })
}
