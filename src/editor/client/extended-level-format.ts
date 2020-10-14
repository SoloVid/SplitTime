namespace splitTime.editor.level {
    export class EditorMetadata {
        displayed: boolean = true
        editorId: string = splitTime.generateUID()
        highlighted: boolean = false
        locked: boolean = false
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

    // interface ExplicitlyTyped<T> {
    //     type: T
    // }

    export class Level {
        fileName: string = ""
        region: string = ""
        width: int = 640
        height: int = 480
        background: string = ""
        backgroundOffsetX: int = 0
        backgroundOffsetY: int = 0
        layers: Layer[] = []
        traces: Trace[] = []
        props: Prop[] = []
        positions: Position[] = []
    }

    export type Layer = ObjectWithEditorMetadata<"layer", splitTime.level.file_data.Layer>
    export type Trace = ObjectWithEditorMetadata<"trace", splitTime.level.file_data.Trace>
    export type Prop = ObjectWithEditorMetadata<"prop", splitTime.level.file_data.Prop>
    export type Position = ObjectWithEditorMetadata<"position", splitTime.level.file_data.Position>

    // export type Layer = splitTime.level.file_data.Layer & EditorEntity
    // export type Trace = splitTime.level.file_data.Trace & EditorEntity
    // export type Prop = splitTime.level.file_data.Prop & EditorEntity
    // export type Position = splitTime.level.file_data.Position & EditorEntity
}