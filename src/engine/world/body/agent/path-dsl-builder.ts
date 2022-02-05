import { Coordinates2D, Coordinates3D, ILevelLocation2 } from "../../../splitTime";
import { WalkOptions, PathDsl } from "./path-dsl";
import { MidEventAction, MidEventCallback } from "../../../time/mid-event-action";
export class Walk {
    constructor(public readonly location: Readonly<Coordinates2D> | Readonly<Coordinates3D>, public readonly options: WalkOptions | null = null) { }
}
export class PathDslBuilder implements PathDsl {
    private steps: (Walk | ILevelLocation2 | MidEventAction)[] = [];
    constructor() {
    }
    walk(location: Readonly<Coordinates2D> | Readonly<Coordinates3D>, options?: WalkOptions): void {
        this.steps.push(new Walk(location, options));
    }
    transport(location: ILevelLocation2): void {
        this.steps.push(location);
    }
    do(action: MidEventCallback): void {
        this.steps.push(new MidEventAction(action));
    }
    build(): readonly (Walk | ILevelLocation2 | MidEventAction)[] {
        return this.steps;
    }
}
