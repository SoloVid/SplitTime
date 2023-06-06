import { instanceOfCollage } from "engine/file/collage"
import { instanceOfFileData as instanceOfLevelFileData } from "engine/world/level/level-file-data"

export type EditorType = "level" | "collage" | "code"

export function detectEditorTypes(fileContents: string): readonly EditorType[] {
  try {
    const parsed = JSON.parse(fileContents)
    if (instanceOfLevelFileData(parsed)) {
      return ["level", "code"]
    }
    if (instanceOfCollage(parsed)) {
      return ["collage", "code"]
    }
  } catch (e) {
    // Do nothing.
  }
  return ["code"]
}
