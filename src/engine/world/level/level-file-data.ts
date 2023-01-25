import * as type from "engine/utils/type";
import { int } from "globals";
import { IsJsonable } from "../../file/json";
import { array, isA, number, object, optional, other, string, stringEnum } from "../../utils/type";
import { TraceType, TraceTypeType } from "./trace/trace-type";

export interface FileData {
    type: "action";
    region: string;
    width: int;
    height: int;
    background: string;
    backgroundOffsetX: int;
    backgroundOffsetY: int;
    groups: readonly Group[];
    traces: readonly Trace[];
    props: readonly Prop[];
    positions: readonly Position[];
}
// Expect compiler error if FileData is not jsonable
let testFileDataJsonable: IsJsonable<FileData, false, true> = {} as FileData;
export interface Group {
    id: string;
    parent: string;
    defaultZ: number;
    defaultHeight: number;
}
export interface Trace {
    id: string;
    group: string;
    type: TraceTypeType;
    vertices: string;
    z: number;
    height: number;
    direction?: string; // for stairs
    event?: string; // for event
    level?: string; // for pointer/transport/send
    offsetX?: number; // for pointer/transport
    offsetY?: number; // for pointer/transport
    offsetZ?: number; // for pointer/transport
    targetPosition?: string; // for send
    color?: string; // for render
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
export function instanceOfFileData(thing: unknown): thing is FileData {
    return isA(thing, object<FileData>({
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
            type: stringEnum(Object.values(TraceType)),
            vertices: string,
            z: number,
            height: number,
            direction: optional(string),
            event: optional(string),
            level: optional(string),
            offsetX: optional(number),
            offsetY: optional(number),
            offsetZ: optional(number),
            targetPosition: optional(string),
            color: optional(string),
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
