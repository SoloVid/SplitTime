namespace splitTime.conversation {
    const MIN_SCORE = 1

    interface LimitedPerspective {
        camera: Camera
        levelManager: { isCurrentSet(): boolean, getCurrent: () => Level }
        playerBody: Body | null
    }

    interface TrackedConversation {
        conversation: ConversationInstance
        runtime: ConversationRuntimeManager
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
        private conversations: TrackedConversation[] = []

        /**
         * If a dialog has been engaged, it will be stored here.
         */
        private engaged: TrackedConversation | null = null

        private readonly connoisseur: ConversationConnoisseur

        constructor(
            private readonly renderer: Renderer,
            // FTODO: Make private again
            private readonly perspective: LimitedPerspective,
            private readonly helper: HelperInfo
        ) {
            this.connoisseur = new ConversationConnoisseur(perspective)
        }

        submitConversation(conversation: ConversationInstance): void {
            assert(!this.conversations.some(t => t.conversation === conversation), "Conversation already submitted")
            const runtime = new ConversationRuntimeManager(conversation, this.helper)
            this.conversations.push({
                conversation,
                runtime
            })
        }

        private getRuntime(conversation: ConversationInstance): ConversationRuntimeManager {
            for (const t of this.conversations) {
                if (t.conversation === conversation) {
                    return t.runtime
                }
            }
            throw new Error("Failed to find conversation runtime")
        }

        interrupt(conversation: ConversationInstance, event: body.CustomEventHandler<void>): void {
            this.getRuntime(conversation).interrupt(event)
        }

        pullOut(conversation: ConversationInstance, speaker: Speaker): void {
            this.getRuntime(conversation).pullOut(speaker.body)
        }

        advance(conversation: ConversationInstance): void {
            this.getRuntime(conversation).advance()
        }

        getConversationForSpeaker(speaker: Speaker): ConversationInstance | null {
            for (const t of this.conversations) {
                for (const s of t.conversation.getCurrentSpeakers()) {
                    if (s === speaker) {
                        return t.conversation
                    }
                }
            }
            return null
        }

        isSpeakerConversing(speaker: Speaker): boolean {
            if (this.getConversationForSpeaker(speaker) !== null) {
                return true
            }
            return false
        }

        notifyFrameUpdate() {
            if (!this.perspective.levelManager.isCurrentSet()) {
                return
            }

            const currentLevel = this.perspective.levelManager.getCurrent()
            const engaged = this.connoisseur.getPicked()
            let engagedDialogStillActive = false
            let winningScore = MIN_SCORE
            let usurper: {conversation: ConversationInstance, speechBubble: SpeechBubbleState} | null = null

            for (const t of this.conversations) {
                t.runtime.notifyFrameUpdate()

                const speechBubble = t.runtime.getSpeechBubble()
                if (speechBubble === null || t.runtime.isFinished()) {
                    continue
                }
                if (engaged !== null && speechBubble === engaged.speechBubble) {
                    engagedDialogStillActive = true
                }

                const location = speechBubble.getLocation()
                // Related timelines make region check (not present) faulty
                if (location.level === currentLevel) {
                    const score = this.connoisseur.calculateConversationImportanceScore(t.conversation, speechBubble)
                    if (score > winningScore) {
                        usurper = {
                            conversation: t.conversation,
                            speechBubble
                        }
                        winningScore = score
                    }
                }
            }

            // Update what speech bubble is rendered.
            const fromLastFrame = engaged ? [engaged] : []
            let toShowThisFrame = usurper ? [usurper] : []
            const toHideThisFrame: typeof fromLastFrame = []

            for (const stale of fromLastFrame) {
                if (toShowThisFrame.some(toShow => stale.speechBubble === toShow.speechBubble)) {
                    // It's already showing, so we don't need to show again.
                    toShowThisFrame = toShowThisFrame.filter(
                        toShow => stale.speechBubble !== toShow.speechBubble
                    )
                } else {
                    toHideThisFrame.push(stale)
                }
            }

            for (const toShow of toShowThisFrame) {
                this.renderer.show(toShow.speechBubble)
            }
            for (const toHide of toHideThisFrame) {
                this.renderer.hide(toHide.speechBubble)

                const conversationContinues = toShowThisFrame.some(
                    toHide => toHide.conversation === toHide.conversation
                )
                if (!conversationContinues) {
                    if (this.perspective.playerBody !== null) {
                        // FTODO: This might be problematic for nested conversations.
                        this.getRuntime(toHide.conversation).pullOut(this.perspective.playerBody)
                    }
                }
            }

            // Mark which one we picked for scoring next round.
            if (usurper === null) {
                this.connoisseur.updatePick(null, null)
            } else {
                this.connoisseur.updatePick(usurper.conversation, usurper.speechBubble)
            }

            // Remove conversations that are done.
            this.conversations = this.conversations.filter(c => !c.runtime.isFinished())

            // Allow renderer to go.
            this.renderer.notifyFrameUpdate()
        }
    }
}
