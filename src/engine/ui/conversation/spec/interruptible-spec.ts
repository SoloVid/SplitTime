import { SectionSpec } from "./section-spec";
import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import { Condition } from "./dsl";
import { Body } from "engine/world/body/body"
import { assert } from "globals";

export class InterruptibleSpec {
    private parent: SectionSpec | null = null;
    constructor(public readonly events: CustomEventHandler<void>[], public readonly condition: Condition, public readonly section: SectionSpec | null = null, public readonly body?: Body) { }
    setParent(parent: SectionSpec): void {
        assert(this.parent === null, "LineSequence parent can only be set once");
        this.parent = parent;
        if (this.section !== null) {
            this.section.setParent(parent);
        }
    }
    getParent(): SectionSpec {
        assert(this.parent !== null, "LineSequence parent should have been set");
        return this.parent!;
    }
    // TODO: should this method be in here?
    get conditionMet(): boolean {
        if (typeof this.condition === "function") {
            return this.condition();
        }
        else if (this.condition === true) {
            return true;
        }
        else {
            // TODO: add in mappy thing
            return false;
        }
    }
}
