import { IsJsonable } from "./json";
import { Trace } from "../world/level/level-file-data";
import { isA, object, string, array, number, stringEnum } from "../utils/type";
import { int } from "globals";
import { game_seconds } from "engine/time/timeline";
import * as type from "engine/utils/type"
import { TraceType } from "engine/world/level/trace/trace-type";
/**
 * Serializable form of {@link splitTime.Collage}, specifically used in JSON file format.
 */
export interface Collage {
    image: string;
    frames: readonly Frame[];
    montages: readonly Montage[];
    /** Reference to a {@link collage.Montage} in {@link Collage#montages} */
    defaultMontageId: string;
}
// Expect compiler error here if Collage is not jsonable
let testCollageJsonable: IsJsonable<Collage, false, true> = {} as Collage;
/**
 * Component of {@link Collage}, specifically used in JSON file format.
 * Specific rectangle within the collage image.
 *
 * Unlike {@link splitTime.collage.Frame}, a single Frame may be used by multiple {@link Montage}s.
 */
export interface Frame {
    id: string;
    x: int;
    y: int;
    width: int;
    height: int;
}
/**
 * Component of {@link Collage}, specifically used in JSON file format.
 * Sequence of {@link Frame}s, with associated geometry.
 */
export interface Montage {
    id: string;
    direction: string;
    frames: readonly MontageFrame[];
    body: BodySpec;
    traces: readonly Trace[];
    /**
     * Identifier for a post-processor that will have a chance
     * to touch any props created from this montage.
     */
    propPostProcessor: string;
    /**
     * Value in [0,1] how much to fade when occluding player.
     */
    playerOcclusionFadeFactor: number;
}
/**
 * Component of {@link Montage}, specifically used in JSON file format.
 *
 * This type is more similar to {@link splitTime.collage.Frame} than {@link Frame} is.
 */
export interface MontageFrame {
    /** Reference to a {@link Frame} object within this {@link Collage#frames} */
    frameId: string;
    offsetX: int;
    offsetY: int;
    duration: game_seconds;
}
export interface BodySpec {
    // along x axis
    width: int;
    // along y axis
    depth: int;
    // along z axis
    height: int;
}
export function instanceOfCollage(thing: unknown): thing is Collage {
    return isA(thing, object<Collage>({
        image: string,
        frames: array(object({
            id: string,
            x: type.int,
            y: type.int,
            width: type.int,
            height: type.int
        })),
        montages: array(object({
            id: string,
            direction: string,
            frames: array(object({
                frameId: string,
                offsetX: type.int,
                offsetY: type.int,
                duration: number
            })),
            body: object({
                width: type.int,
                depth: type.int,
                height: type.int
            }),
            traces: array(object({
                id: string,
                group: string,
                type: stringEnum(Object.values(TraceType)),
                vertices: string,
                z: number,
                height: number,
                direction: string,
                event: string,
                level: string,
                offsetX: number,
                offsetY: number,
                offsetZ: number,
                targetPosition: string,
                color: string,
            })),
            propPostProcessor: string,
            playerOcclusionFadeFactor: number
        })),
        defaultMontageId: string
    }));
}
