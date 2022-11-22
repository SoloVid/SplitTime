import { Walk, PathDslBuilder } from "./path-dsl-builder";
import { Behavior } from "../../../npc/behavior";
import { DirectedWalkBehavior } from "../../../npc/directed-walk-behavior";
import { MidEventAction } from "../../../time/mid-event-action";
import { PathSpec } from "./path-spec";
import { Npc } from "engine/npc/npc";
import { Indirect } from "engine/redirect";
import { game_seconds } from "engine/time/timeline";
import { SimpleCallback } from "engine/utils/callback";
import { ObjectCallbacks } from "engine/utils/object-callbacks";
import { instanceOfRunnable } from "engine/utils/runnable";
import { Level } from "engine/world/level/level";
import { Coordinates2D, ILevelLocation2, instanceOfILevelLocation2, Coordinates3D } from "engine/world/level/level-location";
import { Position } from "engine/world/level/position";
import { int } from "globals";

class StageCallback implements SimpleCallback<void> {
    constructor(private readonly pathWalker: PathWalker, private readonly stage: int) { }
    callBack(): void {
        this.pathWalker.advanceFromStage(this.stage);
    }
}
class CurrentWalk {
    // TODO: needs to be 3D
    steps: Coordinates2D[];
    nextDestination: int = 0;
    constructor(startingLocation: Coordinates2D | Position, private readonly walk: Walk, public readonly level: Level) {
        if (startingLocation instanceof Position) {
            this.steps = startingLocation.getPathTo(walk.location).concat(walk.location);
        }
        else {
            this.steps = [walk.location];
        }
    }
}
export class PathWalker implements Behavior {
    private lastKnownLocation: Coordinates2D | Position | null = null;
    private nextStageIndex: int = 0;
    private currentWalk: CurrentWalk | null = null;
    private currentWalkBehavior: DirectedWalkBehavior | null = null;
    private readonly stages: readonly (ILevelLocation2 | Walk | MidEventAction)[];
    private isStarted = false;
    private readonly completionCallbacks = new ObjectCallbacks<void>();
    constructor(private readonly pathSpec: PathSpec, private readonly npc: Npc, private readonly speed: Indirect<number>, private readonly stance: string) {
        const builder = new PathDslBuilder();
        pathSpec.setup(builder);
        this.stages = builder.build();
    }
    isComplete(): boolean {
        return this.isStarted && this.nextStageIndex > this.stages.length;
    }
    waitForComplete(): ObjectCallbacks<void> {
        return this.completionCallbacks;
    }
    notifySuspension(): void {
        throw new Error("Method not implemented.");
    }
    notifyTimeAdvance(delta: game_seconds): void {
        if (!this.isStarted) {
            this.nextStep();
            this.isStarted = true;
        }
        if (this.currentWalk === null || this.currentWalkBehavior === null) {
            return;
        }
        const targetLocation = this.currentWalk.steps[this.currentWalk.nextDestination];
        this.currentWalkBehavior.notifyTimeAdvance(delta);
        if (this.currentWalkBehavior.isComplete()) {
            if (this.npc.body.level === this.currentWalk.level) {
                this.lastKnownLocation = targetLocation;
            }
            else {
                // If the level changed, we're just hoping that the next item was a transport
                // and it happened automatically via walking.
                // Otherwise...not sure what we would do here.
            }
            this.nextStep();
        }
    }
    advanceFromStage(stageIndex: int): void {
        if (stageIndex + 1 === this.nextStageIndex) {
            this.nextStep();
        }
    }
    private nextStep(): void {
        this.currentWalkBehavior = null;
        if (this.currentWalk !== null) {
            this.currentWalk.nextDestination++;
            if (this.currentWalk.nextDestination < this.currentWalk.steps.length) {
                const targetLocation = this.currentWalk.steps[this.currentWalk.nextDestination];
                const coords = this.coordsAs3D(targetLocation);
                this.currentWalkBehavior = new DirectedWalkBehavior(this.npc, coords, this.speed, this.stance);
                return;
            }
        }
        this.currentWalk = null;
        const stageIndex = this.nextStageIndex++;
        if (stageIndex >= this.stages.length) {
            this.completionCallbacks.run();
            return;
        }
        const stage = this.stages[stageIndex];
        if (instanceOfRunnable(stage)) {
            const result = stage.run();
            if (result !== undefined) {
                result.then(new StageCallback(this, stageIndex));
            }
            else {
                this.nextStep();
            }
            // } else if (stage instanceof Position) {
            //     this.npc.spriteBody.putInPosition(stage)
            //     this.lastKnownLocation = stage
            //     this.nextStep()
        }
        else if (instanceOfILevelLocation2(stage)) {
            this.npc.body.putInLocation(stage);
            this.lastKnownLocation = stage;
            this.nextStep();
        }
        else {
            const previousStep = stageIndex > 0 ? this.stages[stageIndex - 1] : null;
            // TODO: support walk as well
            // const startLocation = instanceOfCoordinates2D(previousStep) ? previousStep : this.npc.body
            const startLocation = this.lastKnownLocation || this.getCloseLocation();
            this.currentWalk = new CurrentWalk(startLocation, stage, this.npc.body.level);
            const targetLocation = this.currentWalk.steps[this.currentWalk.nextDestination];
            const coords = this.coordsAs3D(targetLocation);
            this.currentWalkBehavior = new DirectedWalkBehavior(this.npc, coords, this.speed, this.stance);
        }
    }
    coordsAs3D(coords2D: Coordinates2D): ILevelLocation2 {
        const newCoords = {
            x: coords2D.x,
            y: coords2D.y,
            z: this.npc.body.z,
            level: this.npc.body.level
        };
        const coordsAs3D = coords2D as Readonly<Coordinates3D>;
        if (!!coordsAs3D.z || coordsAs3D.z === 0) {
            newCoords.z = coordsAs3D.z;
        }
        return newCoords;
    }
    private getCloseLocation(): Coordinates2D | Position {
        const positionMap = this.npc.body.level.getPositionMap();
        for (const positionId in positionMap) {
            const pos = positionMap[positionId];
            if (closeEnough(this.npc.body, pos)) {
                return pos;
            }
        }
        return this.npc.body;
    }
}
function closeEnough(a: Coordinates3D, b: Coordinates3D): boolean {
    const approxDist = Math.abs(a.x - b.x) +
        Math.abs(a.y - b.y) +
        Math.abs(a.z - b.z);
    const CLOSE_ENOUGH = 4;
    return approxDist < CLOSE_ENOUGH;
}
