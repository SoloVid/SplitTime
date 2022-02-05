import { SetupFunc } from "./path-dsl";
export class PathSpec {
    constructor(public readonly id: string, public readonly setup: SetupFunc) {
    }
}
