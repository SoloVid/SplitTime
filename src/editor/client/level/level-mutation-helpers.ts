import { ImmutableSetter } from "../preact-help";
import { EditorGroup, EditorLevel } from "./extended-level-format";

export function addGroup(setLevel: ImmutableSetter<EditorLevel>, group: EditorGroup) {
  setLevel((before) => ({
    ...before,
    groups: [
      ...before.groups,
      group,
    ]
  }))
}
