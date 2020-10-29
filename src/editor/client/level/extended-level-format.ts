namespace splitTime.editor.level {
    export class Level {
        region: string = ""
        width: int = 640
        height: int = 480
        background: string = ""
        backgroundOffsetX: int = 0
        backgroundOffsetY: int = 0
        groups: Group[] = []
        traces: Trace[] = []
        props: Prop[] = []
        positions: Position[] = []
    }

    export type Group = client.ObjectWithEditorMetadata<"group", splitTime.level.file_data.Group>
    export type Trace = client.ObjectWithEditorMetadata<"trace", splitTime.level.file_data.Trace>
    export type Prop = client.ObjectWithEditorMetadata<"prop", splitTime.level.file_data.Prop>
    export type Position = client.ObjectWithEditorMetadata<"position", splitTime.level.file_data.Position>
}