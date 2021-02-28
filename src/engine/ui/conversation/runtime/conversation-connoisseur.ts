namespace splitTime.conversation {
    const MIN_SCORE = 1

    interface LimitedPerspective {
        camera: Camera
        levelManager: { isCurrentSet(): boolean, getCurrent: () => Level }
        playerBody: Body | null
    }

    interface LastPicked {
        conversation: ConversationInstance
        speechBubble: SpeechBubbleState
    }

    /**
     * Decides which conversation is the most important.
     */
    export class ConversationConnoisseur {

        private lastPicked: LastPicked | null = null

        constructor(
            private readonly perspective: LimitedPerspective
        ) {}

        updatePick(conversation: null, speechBubble: null): void
        updatePick(conversation: ConversationInstance, speechBubble: SpeechBubbleState): void
        updatePick(conversation: ConversationInstance | null, speechBubble: SpeechBubbleState | null): void {
            if (conversation === null || speechBubble === null) {
                this.lastPicked = null
            } else {
                this.lastPicked = {
                    conversation,
                    speechBubble
                }
            }
        }

        calculateConversationImportanceScore(conversation: ConversationInstance, speechBubble: SpeechBubbleState): number {
            if (
                speechBubble.getLocation().level !==
                this.perspective.levelManager.getCurrent()
            ) {
                return MIN_SCORE - 1
            }

            var focusPoint = this.perspective.camera.getFocusPoint()
            var location = speechBubble.getLocation()

            var distance = splitTime.measurement.distanceEasy(
                focusPoint.x,
                focusPoint.y,
                location.x,
                location.y
            )
            const conversationContinues = this.lastPicked !== null && conversation === this.lastPicked.conversation
            // If we've engaged in a dialog, we don't want to accidentally stop tracking the conversation just because the speaker changed.
            if (conversationContinues) {
                // TODO: Current speakers doesn't always accurately reflect speech bubble speakers.
                const speakersExcludingPlayer = speechBubble.allSpeakers.filter(
                    s => s.body !== this.perspective.playerBody
                )
                if (speakersExcludingPlayer.length > 0) {
                    distance = speakersExcludingPlayer
                        .map(s =>
                            splitTime.measurement.distanceEasy(
                                focusPoint.x,
                                focusPoint.y,
                                s.body.getX(),
                                s.body.getY()
                            )
                        )
                        .reduce(
                            (tempMin, tempDist) => Math.min(tempMin, tempDist),
                            splitTime.MAX_SAFE_INTEGER
                        )
                }
            }
            var distanceScore =
                this.perspective.camera.SCREEN_WIDTH /
                3 /
                Math.max(distance, 0.0001)

            if (conversationContinues) {
                return distanceScore * 1.5
            }
            return distanceScore
        }

        // getCurrentScore(): number {
        //     if (this.lastPicked === null) {
        //         return 0
        //     }
        //     return this.calculateConversationImportanceScore(this.lastPicked.conversation, this.lastPicked.speechBubble)
        // }

        getPicked(): LastPicked | null {
            return this.lastPicked
        }

        getPickedConversation(): ConversationInstance | null {
            if (this.lastPicked === null) {
                return null
            }
            return this.lastPicked.conversation
        }
        getPickedSpeechBubble(): SpeechBubbleState | null {
            if (this.lastPicked === null) {
                return null
            }
            return this.lastPicked.speechBubble
        }
    }
}
