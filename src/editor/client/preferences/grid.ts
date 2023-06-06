import { GlobalEditorPreferences } from "./global-preferences";

export function coalescePreferencesGridCell(preferences: GlobalEditorPreferences) {
  return preferences.gridEnabled ? preferences.gridCell : { x: 1, y: 1 }
}
