import { Camera, Level, assert } from "../../../splitTime";
import { ConversationInstance } from "./conversation-instance";
import { ConversationRuntimeManager } from "./conversation-runtime-manager";
import { ConversationConnoisseur } from "./conversation-connoisseur";
import { Renderer } from "./renderer";
import { HelperInfo } from "./helper-info";
import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import { Speaker } from "../speaker";
import { LineSpeechBubble } from "./line-speech-bubble";
import * as splitTime from "../../../splitTime";
const MIN_SCORE = 1;
interface LimitedPerspective {
    camera: Camera;
    levelManager: {
        isCurrentSet(): boolean;
        getCurrent: () => Level;
    };
    playerBody: splitTime.Body | null;
}
interface TrackedConversation {
    conversation: ConversationInstance;
    runtime: ConversationRuntimeManager;
}
/**
 * Serves as a point of contact for all dialog-related decisions
 *
 * For example:
 * - Give speech bubbles a chance to update themselves.
 * - Choose which speech bubbles should display on the screen (and push to renderer).
 * - Delegate screen interactions from the player to appropriate speech bubbles.
 */
export class Secretary {
    private conversations: TrackedConversation[] = [];
    private readonly connoisseur: ConversationConnoisseur;
    constructor(private readonly renderer: Renderer, private readonly perspective: LimitedPerspective, private readonly helper: HelperInfo) {
        this.connoisseur = new ConversationConnoisseur(perspective);
    }
    submitConversation(conversation: ConversationInstance): void {
        assert(!this.conversations.some(t => t.conversation === conversation), "Conversation already submitted");
        const runtime = new ConversationRuntimeManager(conversation, this.helper);
        this.conversations.push({
            conversation,
            runtime
        });
    }
    private getRuntime(conversation: ConversationInstance): ConversationRuntimeManager {
        for (const t of this.conversations) {
            if (t.conversation === conversation) {
                return t.runtime;
            }
        }
        throw new Error("Failed to find conversation runtime");
    }
    interrupt(conversation: ConversationInstance, event: CustomEventHandler<void>): void {
        this.getRuntime(conversation).interrupt(event);
    }
    pullOut(conversation: ConversationInstance, speaker: Speaker): void {
        this.getRuntime(conversation).pullOut(speaker.body);
    }
    advance(conversation: ConversationInstance): void {
        this.getRuntime(conversation).advance();
    }
    getEngagedConversation(): ConversationInstance | null {
        const engaged = this.connoisseur.getPicked();
        if (engaged === null) {
            return null;
        }
        return engaged.conversation;
    }
    getConversationForSpeaker(speaker: Speaker): ConversationInstance | null {
        for (const t of this.conversations) {
            for (const s of t.conversation.getCurrentSpeakers()) {
                if (s === speaker) {
                    return t.conversation;
                }
            }
        }
        return null;
    }
    isSpeakerConversing(speaker: Speaker): boolean {
        if (this.getConversationForSpeaker(speaker) !== null) {
            return true;
        }
        return false;
    }
    notifyFrameUpdate() {
        if (!this.perspective.levelManager.isCurrentSet()) {
            return;
        }
        const currentLevel = this.perspective.levelManager.getCurrent();
        const engaged = this.connoisseur.getPicked();
        let winningScore = MIN_SCORE;
        let usurper: {
            conversation: ConversationInstance;
            lineSpeechBubble: LineSpeechBubble | null;
        } | null = null;
        for (const t of this.conversations) {
            t.runtime.notifyFrameUpdate();
            if (t.runtime.isFinished()) {
                continue;
            }
            const lineSpeechBubble = t.runtime.getLineSpeechBubble();
            let score: number = 0;
            if (t.conversation === engaged?.conversation) {
                score = this.connoisseur.calculateContinuingConversationScore(engaged.conversation);
            }
            else if (lineSpeechBubble !== null) {
                const location = lineSpeechBubble.speechBubble.getLocation();
                // Related timelines make region check (not present) faulty
                if (location === null || location.level === currentLevel) {
                    score = this.connoisseur.calculateLineImportanceScore(lineSpeechBubble);
                }
            }
            if (score > winningScore) {
                usurper = {
                    conversation: t.conversation,
                    lineSpeechBubble
                };
                winningScore = score;
            }
        }
        // Update what speech bubble is rendered.
        const fromLastFrame = engaged ? [engaged] : [];
        let toShowThisFrame = usurper ? [usurper] : [];
        const toHideThisFrame: typeof fromLastFrame = [];
        for (const stale of fromLastFrame) {
            if (toShowThisFrame.some(toShow => stale.lineSpeechBubble === toShow.lineSpeechBubble)) {
                // It's already showing, so we don't need to show again.
                toShowThisFrame = toShowThisFrame.filter(toShow => stale.lineSpeechBubble !== toShow.lineSpeechBubble);
            }
            else {
                toHideThisFrame.push(stale);
            }
        }
        for (const toShow of toShowThisFrame) {
            if (toShow.lineSpeechBubble) {
                this.renderer.show(toShow.lineSpeechBubble.speechBubble);
            }
        }
        for (const toHide of toHideThisFrame) {
            if (toHide.lineSpeechBubble) {
                this.renderer.hide(toHide.lineSpeechBubble.speechBubble);
            }
            const conversationContinues = toShowThisFrame.some(toHide => toHide.conversation === toHide.conversation);
            if (!conversationContinues) {
                if (this.perspective.playerBody !== null) {
                    // FTODO: This might be problematic for nested conversations.
                    this.getRuntime(toHide.conversation).pullOut(this.perspective.playerBody);
                }
            }
        }
        // Mark which one we picked for scoring next round.
        if (usurper === null) {
            this.connoisseur.updatePick(null, null);
        }
        else {
            this.connoisseur.updatePick(usurper.conversation, usurper.lineSpeechBubble);
        }
        // Remove conversations that are done.
        this.conversations = this.conversations.filter(c => !c.runtime.isFinished());
        // Allow renderer to go.
        this.renderer.notifyFrameUpdate();
    }
}
