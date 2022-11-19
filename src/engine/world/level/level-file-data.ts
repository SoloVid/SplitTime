import { int, level, type } from "../../splitTime";
import { file_data } from "../../splitTime.level";
import { IsJsonable } from "../../file/json";
import { isA, object, other, string, array, number } from "../../utils/type";
export interface FileData {
    type: "action";
    region: string;
    width: int;
    height: int;
    background: string;
    backgroundOffsetX: int;
    backgroundOffsetY: int;
    groups: readonly file_data.Group[];
    traces: readonly file_data.Trace[];
    props: readonly file_data.Prop[];
    positions: readonly file_data.Position[];
}
// Expect compiler error if FileData is not jsonable
let testFileDataJsonable: IsJsonable<FileData, false> = {} as FileData;
export interface Group {
    id: string;
    parent: string;
    defaultZ: number;
    defaultHeight: number;
}
export interface Trace {
    id: string;
    group: string;
    type: string;
    vertices: string;
    z: number;
    height: number;
    direction: string; // for stairs
    event: string; // for event
    level: string; // for pointer/transport/send
    offsetX: number; // for pointer/transport
    offsetY: number; // for pointer/transport
    offsetZ: number; // for pointer/transport
    targetPosition: string; // for send
}
export interface Prop {
    id: string;
    group: string;
    collage: string;
    montage: string;
    x: number;
    y: number;
    z: number;
    dir: string;
}
/** Alias */
export type Position = Prop;
export function instanceOfFileData(thing: unknown): thing is level.FileData {
    return isA(thing, object<level.FileData>({
        type: other<"action">(t => t === "action"),
        region: string,
        width: type.int,
        height: type.int,
        background: string,
        backgroundOffsetX: type.int,
        backgroundOffsetY: type.int,
        groups: array(object({
            id: string,
            parent: string,
            defaultZ: number,
            defaultHeight: number
        })),
        traces: array(object({
            id: string,
            group: string,
            type: string,
            vertices: string,
            z: number,
            height: number,
            direction: string,
            event: string,
            level: string,
            offsetX: number,
            offsetY: number,
            offsetZ: number,
            targetPosition: string
        })),
        props: array(object({
            id: string,
            group: string,
            collage: string,
            montage: string,
            x: number,
            y: number,
            z: number,
            dir: string
        })),
        positions: array(object({
            id: string,
            group: string,
            collage: string,
            montage: string,
            x: number,
            y: number,
            z: number,
            dir: string
        }))
    }));
}
