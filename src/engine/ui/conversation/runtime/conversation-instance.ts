import { ConversationLeafNode } from "../misc-types";
import { SectionSpec } from "../spec/section-spec";
import { TreeTraveler } from "./tree-traveler";
import { ConversationSpec } from "../spec/conversation-spec";
import { Speaker } from "../speaker";
import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import { assert } from "globals";
import { Body } from "engine/world/body/body"

interface Current {
    action: ConversationLeafNode;
    section: SectionSpec;
}
/**
 * Class responsible for managing the high-level state machine of a running conversation.
 *
 * This class holds a reference to a ConversationSpec and keeps track of
 * which node is current. It also interfaces with TreeTraveler
 * to conveniently navigate from one node to the next.
 */
export class ConversationInstance {
    private current: Current | null = null;
    private readonly treeTraveler: TreeTraveler = new TreeTraveler();
    constructor(private readonly spec: ConversationSpec) {
        const first = this.treeTraveler.getFirst(this.spec.topLevelSection);
        this.goToNode(first);
    }
    getCurrentSpeakers(): readonly Speaker[] {
        if (this.current === null) {
            return [];
        }
        return this.current.section.getSpeakers();
    }
    getCurrentLeaf(): ConversationLeafNode | null {
        if (this.current === null) {
            return null;
        }
        return this.current.action;
    }
    isCurrentNode(node: ConversationLeafNode): boolean {
        return this.current !== null && this.current.action === node;
    }
    advanceToNext(): void {
        assert(this.current !== null, "Conversation current should not be null when advancing");
        const nextAction = this.treeTraveler.getNextAfter(this.current.action);
        this.goToNode(nextAction);
    }
    private goToNode(action: ConversationLeafNode | null): void {
        if (action === null) {
            // Conversation is done
            this.current = null;
            return;
        }
        const section = this.treeTraveler.getNearestParentSection(action);
        const newCurrent: Current = {
            action,
            section
        };
        this.current = newCurrent;
    }
    tryCancel(body: Body): boolean {
        if (this.current === null) {
            return false;
        }
        const node = this.current.action;
        if (!this.shouldBeCanceled(node, body)) {
            return false;
        }
        let cancelNext = this.treeTraveler.getCanceledFrom(node);
        while (cancelNext !== null && this.shouldBeCanceled(node, body)) {
            cancelNext = this.treeTraveler.getCanceledFrom(cancelNext);
        }
        this.goToNode(cancelNext);
        return true;
    }
    private shouldBeCanceled(node: ConversationLeafNode, leavingBody: Body): boolean {
        const section = this.treeTraveler.getNearestParentSection(node);
        const speakers = section.getSpeakers();
        return speakers.some(s => s.body === leavingBody);
    }
    tryInterrupt(event: CustomEventHandler<void>): boolean {
        if (this.current === null) {
            return false;
        }
        const node = this.current.action;
        const nextPerInterrupt = this.treeTraveler.getInterruptedFrom(event, node);
        if (nextPerInterrupt === null) {
            return false;
        }
        this.goToNode(nextPerInterrupt);
        return true;
    }
}
