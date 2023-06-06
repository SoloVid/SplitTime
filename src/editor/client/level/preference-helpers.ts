import { ImmutableSetter } from "../preact-help";
import { LevelEditorPreferences } from "./level-preferences";

export function setActiveGroup(setPrefs: ImmutableSetter<LevelEditorPreferences>, groupId: string) {
  setPrefs((before) => ({
    ...before,
    activeGroup: groupId,
  }))
}
