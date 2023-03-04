import { MultilineStringInput } from "../input"
import { ImmutableSetter } from "../preact-help"
import { GlobalEditorShared } from "../shared-types"

type CollageEditorProps = {
  readonly editorGlobalStuff: GlobalEditorShared
  readonly code: string
  readonly setCode: ImmutableSetter<string | null>
  readonly style: string
}

export default function CodeEditor(props: CollageEditorProps) {
  return <MultilineStringInput
    value={props.code}
    onChange={newValue => props.setCode(o => newValue)}
    style={`font-family: monospace; overflow: auto; resize: none; ${props.style}`}
  >
  </MultilineStringInput>
}
