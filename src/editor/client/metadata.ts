import { generateUID } from "engine/utils/misc"
import { useState } from "preact/hooks"

export class EditorMetadata {
  readonly displayed: boolean = true
  readonly editorId: string = generateUID()
  readonly highlighted: boolean = false
}

export type EditorGroupMetadata = {
  readonly editorId: string
  readonly collapsed: boolean
}

export function withMetadata<TypeString, T>(type: TypeString, obj: T): ObjectWithEditorMetadata<TypeString, T> {
  return new ObjectWithEditorMetadata(type, obj)
}

export class ObjectWithEditorMetadata<TypeString, T> {
  constructor(
    public type: TypeString,
    public obj: T,
    public metadata: EditorMetadata = new EditorMetadata()
  ) {}
}

export function useObjectWithEditorMetadata<TypeString, T>(type: TypeString, obj: T) {
  const [metadata, setMetadata] = useState(new EditorMetadata())
  return {
    type,
    obj,
    metadata,
    setMetadata,
  }
}
