namespace SplitTime.dialog {
    const MIN_SCORE = 1;

    interface LimitedPerspective {
        camera: Camera;
        levelManager: { getCurrentLevel: () => Level };
        playerBody: Body;
    }
        
    /**
    * Serves as a point of contact for all dialog-related decisions
    *
    * For example:
    * - Give Dialog objects a chance to update themselves.
    * - Choose which Dialog object(s) should display on the screen (and push to DialogRenderer).
    * - Delegate screen interactions from the player to appropriate Dialog objects.
    */
    export class Manager {
        private dialogs: SpeechBubble[] = [];
        
        /**
        * If a dialog has been engaged, it will be stored here.
        */
        private engagedDialog: SpeechBubble|null = null;

        private engagedConversation: Conversation|null = null;

        constructor(private readonly renderer: Renderer, private readonly perspective: LimitedPerspective) {

        }
        
        /**
        * Allow dialog manager to start managing the dialog.
        */
        submit(dialog: SpeechBubble) {
            if(this.dialogs.indexOf(dialog) < 0) {
                this.dialogs.push(dialog);
            }
        };
        
        /**
        * Stop dialog manager from managing the dialog.
        */
        remove(dialog: SpeechBubble) {
            for(var i = this.dialogs.length - 1; i >= 0; i--) {
                if(this.dialogs[i] === dialog) {
                    this.dialogs.splice(i, 1);
                    this.renderer.hide(dialog);
                }
            }
            if(dialog === this.engagedDialog) {
                this.engagedDialog = null;
                this.engagedConversation = null;
            }
        };
        
        /**
        * This method should be used sparingly, essentially only for major plot points.
        * This method allows a new dialog to take precedence over one which is actively engaged.
        */
        disengageAllDialogs() {
            this.engagedDialog = null;
            this.engagedConversation = null;
        };
        
        notifyFrameUpdate() {
            var currentLevel = this.perspective.levelManager.getCurrentLevel();
            var currentRegion = currentLevel.getRegion();
            
            var engagedScore = this.engagedDialog ? this.calculateDialogImportanceScore(this.engagedDialog) : 0;
            var winningScore = Math.max(engagedScore, MIN_SCORE);
            var usurper = null;
            
            for(var i = 0; i < this.dialogs.length; i++) {
                var dialog = this.dialogs[i];
                var location = dialog.getLocation();
                var level = location.getLevel();
                if(level.getRegion() === currentRegion) {
                    dialog.notifyFrameUpdate();
                    if(level === currentLevel && !dialog.isFinished()) {
                        var score = this.calculateDialogImportanceScore(dialog);
                        if(score > winningScore) {
                            usurper = dialog;
                            winningScore = score;
                        }
                    }
                }
            }
            
            if(this.engagedDialog && winningScore > engagedScore) {
                this.renderer.hide(this.engagedDialog);
                this.engagedDialog = null;
                this.engagedConversation = null;
            }
            
            if(usurper !== null) {
                this.engagedDialog = usurper;
                this.engagedConversation = this.engagedDialog.conversation;
                this.renderer.show(this.engagedDialog);
            }
            
            this.renderer.notifyFrameUpdate();
        };
        
        private calculateDialogImportanceScore(dialog: SpeechBubble) {
            if(dialog.getLocation().getLevel() !== this.perspective.levelManager.getCurrentLevel()) {
                return MIN_SCORE - 1;
            }
            
            var focusPoint = this.perspective.camera.getFocusPoint();
            var location = dialog.getLocation();
            
            var distance = SplitTime.Measurement.distanceEasy(focusPoint.x, focusPoint.y, location.getX(), location.getY());
            // If we've engaged in a dialog, we don't want to accidentally stop tracking the conversation just because the speaker changed.
            if(dialog.conversation === this.engagedConversation) {
                const speakersExcludingPlayer = dialog.conversation.speakers.filter(s => s.body !== this.perspective.playerBody);
                if(speakersExcludingPlayer.length > 0) {
                    distance = speakersExcludingPlayer
                        .map(s => SplitTime.Measurement.distanceEasy(focusPoint.x, focusPoint.y, s.body.getX(), s.body.getY()))
                        .reduce((tempMin, tempDist) => Math.min(tempMin, tempDist), SLVD.MAX_SAFE_INTEGER);
                }
            }
            var distanceScore = ((this.perspective.camera.SCREEN_WIDTH / 3) / Math.max(distance, 0.0001));
            
            if(dialog.conversation === this.engagedConversation) {
                return distanceScore * 1.5;
            }
            return distanceScore;
        }
    }
}