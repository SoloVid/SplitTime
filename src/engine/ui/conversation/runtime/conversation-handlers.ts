import { ConversationPointRuntimeManager } from "./conversation-runtime-manager";
import { ConversationLeafNode } from "../misc-types";
import { SectionSpec } from "../spec/section-spec";
import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import { CallbackResult, STOP_CALLBACKS } from "engine/utils/register-callbacks";
import { Body } from "engine/world/body/body";

/**
 * Class responsible for managing the lifecycle of Body events associated with conversation points.
 */
export class ConversationHandlers {
    private isTornDown = false;
    private readonly specs: EventListenerSpec[] = [];
    constructor(private readonly runtime: ConversationPointRuntimeManager, private readonly node: ConversationLeafNode, private readonly section: SectionSpec, private readonly interactEvent: CustomEventHandler<void>) {
        for (const speaker of this.section.getSpeakers()) {
            let isInteractAlsoInterrupt = false;
            for (const interruptible of this.section.interruptibles) {
                for (const event of interruptible.events) {
                    if (event === interactEvent) {
                        isInteractAlsoInterrupt = true;
                    }
                    this.specs.push({
                        event,
                        body: speaker.body,
                        callback: this.makeCallback(() => {
                            this.runtime.at(this.node).interrupt(event);
                            // const interrupted = this.conversation.tryInterrupt(event)
                            // if (!interrupted && isInteractAlsoInterrupt) {
                            //     this.conversation.advanceToNext()
                            // }
                        })
                    });
                }
            }
            if (!isInteractAlsoInterrupt) {
                this.specs.push({
                    event: interactEvent,
                    body: speaker.body,
                    callback: this.makeCallback(() => this.runtime.at(this.node).advance())
                });
            }
        }
    }
    setUp(): void {
        // FTODO: Try to push this up the chain so that we don't attach and detach so often
        for (const spec of this.specs) {
            spec.event.registerListener(spec.body, spec.callback);
        }
    }
    tearDown(): void {
        this.isTornDown = true;
        for (const spec of this.specs) {
            spec.event.removeListener(spec.body, spec.callback);
        }
    }
    private makeCallback(callbackMeat: () => void): () => CallbackResult {
        return () => {
            if (this.isTornDown) {
                return STOP_CALLBACKS;
            }
            // if (!this.conversation.isCurrentNode(this.node)) {
            //     splitTime.log.warn("Trying to call back for some non-current conversation node")
            //     return
            // }
            callbackMeat();
            return;
        };
    }
}
interface EventListenerSpec {
    event: CustomEventHandler<void>;
    body: Body;
    callback: () => CallbackResult;
}
