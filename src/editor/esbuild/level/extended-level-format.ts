import { int } from "api"
import { Group as FileGroup, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"
import { ObjectWithEditorMetadata } from "../shared-types"

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

export type Group = ObjectWithEditorMetadata<"group", FileGroup>
export type Trace = ObjectWithEditorMetadata<"trace", FileTrace>
export type Prop = ObjectWithEditorMetadata<"prop", FileProp>
export type Position = ObjectWithEditorMetadata<"position", FilePosition>