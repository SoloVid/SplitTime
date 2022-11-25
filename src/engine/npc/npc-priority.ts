import { int } from "globals";
import { Npc } from "./npc";

// The levels below are just default suggestions
export const priority = {
    /** First-priority e.g. talking / attacking */
    PRIORITY: 0,
    /** Special but preemptible e.g. path-walking */
    DIRECTED: 1,
    /** Last-resort behavior e.g. wandering */
    IDLE: 2,
}

export class NpcPriority {
    constructor(public readonly npc: Npc, public readonly level: int = priority.PRIORITY) { }
}
