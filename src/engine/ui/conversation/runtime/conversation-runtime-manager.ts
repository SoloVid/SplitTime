import { ConversationLeafRunner } from "./conversation-leaf-runner";
import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import { ConversationLeafNode } from "../misc-types";
import { LineSpeechBubble } from "./line-speech-bubble";
import { ConversationInstance } from "./conversation-instance";
import { HelperInfo } from "./helper-info";
import { warn } from "../../../utils/logger";
import * as splitTime from "../../../splitTime";
interface Current {
    // action: ConversationLeafNode
    // section: SectionSpec
    runner: ConversationLeafRunner;
}
export interface IConversationRuntimeManager {
    // isFinished(): boolean
    interrupt(event: CustomEventHandler<void>): void;
    pullOut(body: splitTime.Body): void;
    advance(): void;
}
export interface ConversationPointRuntimeManager {
    at(node: ConversationLeafNode): IConversationRuntimeManager;
}
const nopConversationRuntimeManager: IConversationRuntimeManager = {
    interrupt() { },
    pullOut() { },
    advance() { },
};
/**
 * Class responsible for managing the lifecycle of a ConversationInstance.
 */
export class ConversationRuntimeManager implements IConversationRuntimeManager, ConversationPointRuntimeManager {
    /** Stuff for our current conversation point. */
    private current: Current | null = null;
    /** Speech bubble displaying. May be a line behind our conversation pointer. */
    private activeLineSpeechBubble: LineSpeechBubble | null = null;
    constructor(public readonly conversation: ConversationInstance, private readonly helper: HelperInfo) {
        this.updateCurrent();
    }
    at(node: ConversationLeafNode): IConversationRuntimeManager {
        if (this.conversation.isCurrentNode(node)) {
            return this;
        }
        warn("Operating on stale conversation point; TODO: Is this a bad thing?");
        return nopConversationRuntimeManager;
    }
    isFinished(): boolean {
        return this.conversation.getCurrentLeaf() === null;
    }
    getLineSpeechBubble(): LineSpeechBubble | null {
        return this.activeLineSpeechBubble;
        // if (this.current === null) {
        //     return null
        // }
        // return this.current.runner.getSpeechBubble()
    }
    private checkForCancellations(): void {
        // TODO: implement
    }
    interrupt(event: CustomEventHandler<void>): void {
        if (this.activeLineSpeechBubble !== null) {
            this.activeLineSpeechBubble.speechBubble.interrupt();
        }
        const interrupted = this.conversation.tryInterrupt(event);
        this.maybeUpdateCurrent(interrupted);
    }
    pullOut(body: splitTime.Body): void {
        if (this.activeLineSpeechBubble !== null) {
            this.activeLineSpeechBubble.speechBubble.interrupt();
        }
        const canceled = this.conversation.tryCancel(body);
        this.maybeUpdateCurrent(canceled);
    }
    private advanceInProgress = false;
    private advanceQueue = 0;
    advance(): void {
        this.advanceQueue++;
        if (this.advanceInProgress) {
            return;
        }
        try {
            this.advanceInProgress = true;
            while (this.advanceQueue > 0) {
                this.advanceQueue--;
                if (this.activeLineSpeechBubble !== null) {
                    this.activeLineSpeechBubble.speechBubble.advance();
                }
                this.conversation.advanceToNext();
                this.updateCurrent();
            }
        }
        finally {
            this.advanceInProgress = false;
        }
    }
    private maybeUpdateCurrent(indication: boolean): void {
        if (indication) {
            this.updateCurrent();
        }
        else if (this.conversation.getCurrentLeaf() === null) {
            this.current = null;
        }
    }
    private updateCurrent(): void {
        const leaf = this.conversation.getCurrentLeaf();
        if (leaf === null) {
            this.current = null;
        }
        else {
            this.current = {
                // action: leaf,
                runner: new ConversationLeafRunner(this, leaf, this.helper)
            };
            // TODO: This can get called in wrong order if new ConversationLeafRunner()
            // triggers another round through here.
            if (this.activeLineSpeechBubble === null) {
                this.activeLineSpeechBubble = this.current.runner.getLineSpeechBubble();
            }
        }
    }
    notifyFrameUpdate(): void {
        this.checkForCancellations();
        if (this.activeLineSpeechBubble !== null) {
            this.activeLineSpeechBubble.speechBubble.notifyFrameUpdate();
            if (this.activeLineSpeechBubble.speechBubble.isFinished()) {
                this.handleSpeechBubbleFinished();
            }
        }
    }
    private handleSpeechBubbleFinished(): void {
        if (this.current === null) {
            this.activeLineSpeechBubble = null;
            return;
        }
        let currentSpeechBubble = this.current.runner.getLineSpeechBubble();
        if (currentSpeechBubble === this.activeLineSpeechBubble) {
            this.activeLineSpeechBubble = null;
            this.advance();
        }
        else {
            // Catch up displayed to actual pointer.
            this.activeLineSpeechBubble = currentSpeechBubble;
        }
    }
}
