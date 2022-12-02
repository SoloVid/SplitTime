import { ImmutableSetter } from "../preact-help"
import { EditorLevel } from "./extended-level-format"

export function onGroupIdUpdate(setLevel: ImmutableSetter<EditorLevel>, oldId: string, newId: string) {
  setLevel((before) => {
    return {
      ...before,
      positions: before.positions.map(p => {
        if (p.obj.group !== oldId) return p
        return { ...p, obj: { ...p.obj, group: newId } }
      }),
      props: before.props.map(p => {
        if (p.obj.group !== oldId) return p
        return { ...p, obj: { ...p.obj, group: newId } }
      }),
      traces: before.traces.map(t => {
        if (t.obj.group !== oldId) return t
        return { ...t, obj: { ...t.obj, group: newId } }
      }),
    }
  })
}
