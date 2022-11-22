import { Behavior } from "./behavior";
import { setDebugValue } from "../utils/debug";
import { approach, areWithin90Degrees, difference, direction_t, normalize } from "../math/direction";
import { distanceEasy, pixels_t } from "../math/measurement";
import { game_seconds } from "engine/time/timeline";
import { mod } from "engine/utils/misc";
import { ILevelLocation2 } from "engine/world/level/level-location";
import { int } from "globals";
import { Npc } from "./npc";
import * as direction from "engine/math/direction"

interface WeightedDirection {
    dir: direction_t;
    weight: number;
}
interface BlacklistedDirection {
    dir: direction_t;
    location: ILevelLocation2;
}
export class WeightedDirectionBehavior implements Behavior {
    private temporaryDirectionBlacklist: BlacklistedDirection[] = [];
    chaseSpeed: pixels_t;
    constructor(private readonly npc: Npc, private readonly getDirectionWeights: () => WeightedDirection[], chaseSpeed: pixels_t) {
        this.chaseSpeed = chaseSpeed;
    }
    notifyTimeAdvance(delta: game_seconds): void {
        const dirWeights = this.getDirectionWeights();
        this.updateBlacklist();
        let bestSlot: int | null = null;
        let bestWeight = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < dirWeights.length; i++) {
            const dirWeight = dirWeights[i];
            if (this.isBlacklisted(dirWeight.dir)) {
                continue;
            }
            if (dirWeight.weight > bestWeight) {
                bestSlot = i;
                bestWeight = dirWeight.weight;
            }
            else if (dirWeight.weight === bestWeight) {
                if (Math.random() < 0.5) {
                    bestSlot = 1;
                    bestWeight = dirWeight.weight;
                }
            }
        }
        if (bestSlot === null) {
            this.temporaryDirectionBlacklist = [];
            return;
        }
        // const bestDir = dirWeights[bestSlot].dir
        const bestDir = interpolateMaxAt(dirWeights, bestSlot).dir;
        const b = this.npc.body;
        const TURN_SPEED = 400000000;
        setDebugValue(b.id, "bestDir", bestDir.toFixed(2) + " (" + direction.toString(bestDir) + ")");
        b.dir = approach(b.dir, bestDir, delta * TURN_SPEED);
        if (areWithin90Degrees(bestDir, b.dir, 1.5)) {
            const moveDist = delta * this.chaseSpeed;
            const moved = b.mover.zeldaBump(moveDist, b.dir);
            if (!moved) {
                this.blacklistDir(dirWeights[bestSlot].dir);
            }
        }
    }
    private isBlacklisted(dir: direction_t): boolean {
        for (const item of this.temporaryDirectionBlacklist) {
            if (item.dir === dir) {
                return true;
            }
        }
        return false;
    }
    private updateBlacklist(): void {
        // if (this.temporaryDirectionBlacklist.length >= maxSize) {
        //     this.temporaryDirectionBlacklist = []
        // }
        const blacklistDist = Math.max(this.npc.body.width, this.npc.body.depth);
        this.temporaryDirectionBlacklist = this.temporaryDirectionBlacklist.filter(item => {
            if (item.location.level !== this.npc.body.level) {
                return false;
            }
            if (distanceEasy(item.location.x, item.location.y, this.npc.body.x, this.npc.body.y) > blacklistDist) {
                return false;
            }
            return true;
        });
    }
    private blacklistDir(dir: direction_t): void {
        // console.log(`Blacklisting ${dir} for ${this.npc.body.id}`)
        this.temporaryDirectionBlacklist.push({
            dir: dir,
            location: {
                x: this.npc.body.x,
                y: this.npc.body.y,
                z: this.npc.body.z,
                level: this.npc.body.level
            }
        });
    }
}
function interpolateMaxAt(arr: WeightedDirection[], i: int): WeightedDirection {
    const leftWeight = arr[mod(i - 1, arr.length)].weight;
    const rightWeight = arr[mod(i + 1, arr.length)].weight;
    if (leftWeight === rightWeight) {
        return arr[i];
    }
    let left: [
        number,
        number
    ];
    let right: [
        number,
        number
    ];
    if (leftWeight > rightWeight) {
        left = [i - 2, i - 1];
        right = [i, i + 1];
    }
    else {
        left = [i - 1, i];
        right = [i + 1, i + 2];
    }
    function point(i: int): [
        x: number,
        y: number
    ] {
        const el = arr[mod(i, arr.length)];
        return [i, el.weight];
    }
    const [x1, y1] = point(i - 1);
    const [x2, y2] = point(i);
    const [x3, y3] = point(i + 1);
    // From https://stackoverflow.com/a/717791/4639640
    const denom = (x1 - x2) * (x1 - x3) * (x2 - x3);
    const a = (x3 * (y2 - y1) + x2 * (y1 - y3) + x1 * (y3 - y2));
    const b = (Math.pow(x3, 2) * (y1 - y2) + Math.pow(x2, 2) * (y3 - y1) + Math.pow(x1, 2) * (y2 - y3));
    const c = (x2 * x3 * (x2 - x3) * y1 + x3 * x1 * (x3 - x1) * y2 + x1 * x2 * (x1 - x2) * y3);
    const interI = -b / (2 * a);
    const interWeight = (c - Math.pow(b, 2) / (4 * a)) / denom;
    const dI = interI - i;
    const dDir = difference(arr[mod(i + 1, arr.length)].dir, arr[i].dir) * dI;
    const interDir = normalize(arr[i].dir + dDir);
    return {
        dir: interDir,
        weight: interWeight
    };
}
