import { SectionSpec } from "./section-spec";
import { MidEventAction, MidEventCallback } from "../../../time/mid-event-action";
import { assert } from "globals";

export class MidConversationAction {
    private parent: SectionSpec | null = null;
    private readonly midEventAction: MidEventAction;
    constructor(callback: MidEventCallback) {
        this.midEventAction = new MidEventAction(callback);
    }
    run() {
        return this.midEventAction.run();
    }
    setParent(parent: SectionSpec): void {
        assert(this.parent === null, "MidConversationAction parent can only be set once");
        this.parent = parent;
    }
    getParent(): SectionSpec {
        assert(this.parent !== null, "MidConversationAction parent should have been set");
        return this.parent!;
    }
}
