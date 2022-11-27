import { EditorMetadata } from "../shared-types"

export type LevelEditorState = {
  readonly groups: readonly EditorMetadata[]
  readonly traces: readonly EditorMetadata[]
  readonly props: readonly EditorMetadata[]
  readonly positions: readonly EditorMetadata[]
}
