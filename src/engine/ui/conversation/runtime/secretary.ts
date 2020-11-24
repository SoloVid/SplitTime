namespace splitTime.conversation {
    const MIN_SCORE = 1

    interface LimitedPerspective {
        camera: Camera
        levelManager: { getCurrent: () => Level }
        playerBody: Body | null
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
        private dialogs: SpeechBubble[] = []

        /**
         * If a dialog has been engaged, it will be stored here.
         */
        private engagedDialog: SpeechBubble | null = null

        private recentlyEngagedConversation: ConversationInstance | null = null

        constructor(
            private readonly renderer: Renderer,
            private readonly perspective: LimitedPerspective
        ) {}

        /**
         * Allow dialog manager to start managing the dialog.
         */
        submit(dialog: SpeechBubble) {
            if (this.dialogs.indexOf(dialog) < 0) {
                this.dialogs.push(dialog)
            }
        }

        /**
         * Stop dialog manager from managing the dialog.
         */
        remove(dialog: SpeechBubble) {
            for (var i = this.dialogs.length - 1; i >= 0; i--) {
                if (this.dialogs[i] === dialog) {
                    this.dialogs.splice(i, 1)
                    this.renderer.hide(dialog)
                }
            }
            if (dialog === this.engagedDialog) {
                this.engagedDialog = null
            }
        }

        isSpeakerConversing(speaker: Speaker): boolean {
            for (const dialog of this.dialogs) {
                for (const s of dialog.conversation.getCurrentSpeakers()) {
                    if (s === speaker) {
                        return true
                    }
                }
            }
            return false
        }

        /**
         * This method should be used sparingly, essentially only for major plot points.
         * This method allows a new dialog to take precedence over one which is actively engaged.
         */
        disengageAllDialogs() {
            this.engagedDialog = null
            this.recentlyEngagedConversation = null
        }

        notifyFrameUpdate() {
            if (this.engagedDialog && this.engagedDialog.isFinished()) {
                this.remove(this.engagedDialog)
            }

            var currentLevel = this.perspective.levelManager.getCurrent()
            var currentRegion = currentLevel.getRegion()

            var engagedScore = this.engagedDialog
                ? this.calculateDialogImportanceScore(this.engagedDialog)
                : 0
            var winningScore = Math.max(engagedScore, MIN_SCORE)
            var usurper = null

            for (var i = 0; i < this.dialogs.length; i++) {
                var dialog = this.dialogs[i]
                var location = dialog.getLocation()
                var level = location.getLevel()
                if (level.getRegion() === currentRegion) {
                    dialog.notifyFrameUpdate()
                    if (level === currentLevel && !dialog.isFinished()) {
                        var score = this.calculateDialogImportanceScore(dialog)
                        if (score > winningScore) {
                            usurper = dialog
                            winningScore = score
                        }
                    }
                }
            }

            if (this.engagedDialog && winningScore > engagedScore) {
                this.renderer.hide(this.engagedDialog)
                this.engagedDialog = null
                this.recentlyEngagedConversation = null
            }

            if (usurper !== null) {
                this.engagedDialog = usurper
                this.recentlyEngagedConversation = this.engagedDialog.conversation
                this.renderer.show(this.engagedDialog)
            }

            this.renderer.notifyFrameUpdate()
        }

        private calculateDialogImportanceScore(dialog: SpeechBubble) {
            if (
                dialog.getLocation().getLevel() !==
                this.perspective.levelManager.getCurrent()
            ) {
                return MIN_SCORE - 1
            }

            var focusPoint = this.perspective.camera.getFocusPoint()
            var location = dialog.getLocation()

            var distance = splitTime.measurement.distanceEasy(
                focusPoint.x,
                focusPoint.y,
                location.getX(),
                location.getY()
            )
            // If we've engaged in a dialog, we don't want to accidentally stop tracking the conversation just because the speaker changed.
            if (dialog.conversation === this.recentlyEngagedConversation) {
                const speakersExcludingPlayer = dialog.conversation.getCurrentSpeakers().filter(
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

            if (dialog.conversation === this.recentlyEngagedConversation) {
                return distanceScore * 1.5
            }
            return distanceScore
        }
    }
}
