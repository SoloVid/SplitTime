import { Collage as CollageFile } from "engine/file/collage";
import { Coordinates2D } from "engine/world/level/level-location";
import { direction_t, interpret, simplifyToCardinal } from "../math/direction";
import { Rect } from "../math/rect";
import { Frame } from "./frame";
import { Montage } from "./montage";

const DEFAULT_MONTAGE_DIR = 9999;
/**
 * Image (e.g. sprite sheet or tile map) with a bunch of associated metadata.
 *
 * A collage has a single image that is split up into a bunch of {@link Frame}s (boxes).
 * These boxes may then be combined into {@link Montage}s which are animations
 * combined with some physics metadata.
 */
export class Collage {
    private readonly montageMap: {
        [id: string]: {
            [direction: number]: Montage;
        };
    } = {};
    constructor(
    /** Path of image backing this Collage */
    readonly image: string, readonly montages: readonly Readonly<Montage>[], private readonly defaultMontageId: string, allowErrors: boolean = false) {
        // Construct map
        for (const montage of montages) {
            const id = montage.id;
            if (!(id in this.montageMap)) {
                this.montageMap[id] = {};
            }
            const dir = montage.direction === null ? DEFAULT_MONTAGE_DIR : montage.direction;
            this.montageMap[id][dir] = montage;
        }
        // Make sure there is a default for each montage
        for (const id in this.montageMap) {
            const bucket = this.montageMap[id];
            if (!(DEFAULT_MONTAGE_DIR in bucket)) {
                for (const dir in bucket) {
                    bucket[DEFAULT_MONTAGE_DIR] = bucket[dir];
                    break;
                }
            }
        }
        if (!this.hasMontage(defaultMontageId) && defaultMontageId !== "") {
            if (!allowErrors) {
                throw new Error("Default montage \"" + defaultMontageId + "\" not found in collage");
            }
            // log.warn("Default montage " + defaultMontageId + " not found in collage")
        }
    }
    hasMontage(id: string): boolean {
        return id in this.montageMap;
    }
    getMontage(id: string, direction?: direction_t | string): Montage {
        if (!this.hasMontage(id)) {
            throw new Error("Montage \"" + id + "\" not found in collage");
        }
        const bucket = this.montageMap[id];
        if (direction === undefined) {
            return bucket[DEFAULT_MONTAGE_DIR];
        }
        const dirKey = interpret(direction);
        if (dirKey in bucket) {
            return bucket[dirKey];
        }
        const simplerDirKey = simplifyToCardinal(dirKey);
        if (simplerDirKey in bucket) {
            return bucket[simplerDirKey];
        }
        return bucket[DEFAULT_MONTAGE_DIR];
    }
    getDefaultMontage(direction?: direction_t | string): Montage {
        return this.getMontage(this.defaultMontageId, direction);
    }
}

export function makeCollageFromFile(file: CollageFile, allowErrors: boolean = false): Collage {
    const framesRectMap: {
        [id: string]: Rect;
    } = {};
    for (const fileFrame of file.frames) {
        framesRectMap[fileFrame.id] =
            Rect.make(fileFrame.x, fileFrame.y, fileFrame.width, fileFrame.height);
    }
    return new Collage(file.image, file.montages.map(fileMontage => {
        const dir = !fileMontage.direction ? null :
            interpret(fileMontage.direction);
        return new Montage(fileMontage.id, dir, fileMontage.frames.map(fpf => {
            if (!(fpf.frameId in framesRectMap)) {
                throw new Error("Could not find frame " + fpf.frameId +
                    " for montage " + fileMontage.id);
            }
            return new Frame(framesRectMap[fpf.frameId], new Coordinates2D(fpf.offsetX, fpf.offsetY), fpf.duration);
        }), fileMontage.body, fileMontage.traces, fileMontage.propPostProcessor, fileMontage.playerOcclusionFadeFactor);
    }), file.defaultMontageId, allowErrors);
}
