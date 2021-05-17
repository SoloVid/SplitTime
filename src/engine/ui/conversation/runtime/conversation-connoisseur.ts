namespace splitTime.conversation {
    const MIN_SCORE = 1

    interface LimitedPerspective {
        camera: Camera
        levelManager: { isCurrentSet(): boolean, getCurrent: () => Level }
        playerBody: Body | null
    }

    interface LastPicked {
        conversation: ConversationInstance
        lineSpeechBubble: LineSpeechBubble | null
    }

    /**
     * Decides which conversation is the most important.
     */
    export class ConversationConnoisseur {

        private lastPicked: LastPicked | null = null

        constructor(
            private readonly perspective: LimitedPerspective
        ) {}

        updatePick(conversation: null, lineSpeechBubble: null): void
        updatePick(conversation: ConversationInstance, lineSpeechBubble: LineSpeechBubble | null): void
        updatePick(conversation: ConversationInstance | null, lineSpeechBubble: LineSpeechBubble | null): void {
            if (conversation === null) {
                this.lastPicked = null
            } else {
                this.lastPicked = {
                    conversation,
                    lineSpeechBubble
                }
            }
        }

        calculateContinuingConversationScore(conversation: ConversationInstance): number {
            const leaf = conversation.getCurrentLeaf()
            if (leaf === null) {
                return 0
            }
            const focusPoint = this.perspective.camera.getFocusPoint()

            // TODO: Current speakers doesn't always accurately reflect speech bubble speakers.
            const allSpeakers = conversation.getCurrentSpeakers()
            const speakersExcludingPlayer = allSpeakers.filter(
                s => s.body !== this.perspective.playerBody
            )
            const speakersToConsider = speakersExcludingPlayer.length > 0 ? speakersExcludingPlayer : allSpeakers
            if (speakersToConsider.length === 0) {
                return 0
            }

            const distance = speakersToConsider
                .map(s =>
                    splitTime.measurement.distanceEasy(
                        focusPoint.x,
                        focusPoint.y,
                        s.body.x,
                        s.body.y
                    )
                )
                .reduce(
                    (tempMin, tempDist) => Math.min(tempMin, tempDist),
                    splitTime.MAX_SAFE_INTEGER
                )

            const continuingBias = 1.5
            const conversationOptions = optionsSniffer.getEffectiveOptions(leaf)
            return this.calculateScoreFromDistance(distance) * continuingBias * conversationOptions.importance
        }

        calculateLineImportanceScore(lineSpeechBubble: LineSpeechBubble): number {
            const location = lineSpeechBubble.speechBubble.getLocation()
            if (
                !!location &&
                location.level !==
                this.perspective.levelManager.getCurrent()
            ) {
                return MIN_SCORE - 1
            }

            const focusPoint = this.perspective.camera.getFocusPoint()

            const distance = !!location ? splitTime.measurement.distanceEasy(
                focusPoint.x,
                focusPoint.y,
                location.x,
                location.y
            ) : 1
            const distanceScore =
                this.perspective.camera.SCREEN_WIDTH /
                3 /
                Math.max(distance, 0.0001)
            const lineOptions = optionsSniffer.getEffectiveOptions(lineSpeechBubble.line)
            return distanceScore * lineOptions.importance
        }

        private calculateScoreFromDistance(distance: number): number {
            return this.perspective.camera.SCREEN_WIDTH /
                3 /
                Math.max(distance, 0.0001)
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
        getPickedLineSpeechBubble(): LineSpeechBubble | null {
            if (this.lastPicked === null) {
                return null
            }
            return this.lastPicked.lineSpeechBubble
        }
    }
}
