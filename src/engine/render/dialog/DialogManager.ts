namespace SplitTime.dialog {
    /**
    * Serves as a point of contact for all dialog-related decisions
    *
    * For example:
    * - Give Dialog objects a chance to update themselves.
    * - Choose which Dialog object(s) should display on the screen (and push to DialogRenderer).
    * - Delegate screen interactions from the player to appropriate Dialog objects.
    */
    
    var dialogs: SpeechBubble[] = [];
    
    /**
    * If a dialog has been engaged, it will be stored here.
    */
    var engagedDialog: SpeechBubble|null = null;
    
    /**
    * Allow dialog manager to start managing the dialog.
    */
    export function submit(dialog: SpeechBubble) {
        if(dialogs.indexOf(dialog) < 0) {
            dialogs.push(dialog);
        }
    };
    
    /**
    * Stop dialog manager from managing the dialog.
    */
    export function remove(dialog: SpeechBubble) {
        for(var i = dialogs.length - 1; i >= 0; i--) {
            if(dialogs[i] === dialog) {
                dialogs.splice(i, 1);
                SplitTime.dialog.renderer.hide(dialog);
            }
        }
        if(dialog === engagedDialog) {
            engagedDialog = null;
        }
    };
    
    /**
    * This method should be used sparingly, essentially only for major plot points.
    * This method allows a new dialog to take precedence over one which is actively engaged.
    */
    export function disengageAllDialogs() {
        engagedDialog = null;
    };
    
    var MIN_SCORE = 1;
    
    export function notifyFrameUpdate() {
        var currentLevel = SplitTime.Level.getCurrent();
        var currentRegion = currentLevel.getRegion();
        
        var engagedScore = engagedDialog ? calculateDialogImportanceScore(engagedDialog) : 0;
        var winningScore = Math.max(engagedScore, MIN_SCORE);
        var usurper = null;
        
        for(var i = 0; i < dialogs.length; i++) {
            var dialog = dialogs[i];
            var location = dialog.getLocation();
            var level = location.getLevel();
            if(level.getRegion() === currentRegion) {
                dialog.notifyFrameUpdate();
                if(level === currentLevel && !dialog.isFinished()) {
                    var score = calculateDialogImportanceScore(dialog);
                    if(score > winningScore) {
                        usurper = dialog;
                        winningScore = score;
                    }
                }
            }
        }
        
        if(engagedDialog && winningScore > engagedScore) {
            SplitTime.dialog.renderer.hide(engagedDialog);
            engagedDialog = null;
        }
        
        if(usurper !== null) {
            engagedDialog = usurper;
            SplitTime.dialog.renderer.show(engagedDialog);
        }
        
        SplitTime.dialog.renderer.notifyFrameUpdate();
    };
    
    function calculateDialogImportanceScore(dialog: SpeechBubble) {
        if(dialog.getLocation().getLevel() !== SplitTime.Level.getCurrent()) {
            return MIN_SCORE - 1;
        }
        
        var focusPoint = SplitTime.BoardRenderer.getFocusPoint();
        var location = dialog.getLocation();
        
        var distance = SplitTime.Measurement.distanceEasy(focusPoint.x, focusPoint.y, location.getX(), location.getY());
        // If we've engaged in a dialog, we don't want to accidentally stop tracking the conversation just because the speaker changed.
        if(dialog === engagedDialog) {
            distance = dialog.conversation.speakers
                .map(s => SplitTime.Measurement.distanceEasy(focusPoint.x, focusPoint.y, s.body.getX(), s.body.getY()))
                .reduce((tempMin, tempDist) => Math.min(tempMin, tempDist), SLVD.MAX_SAFE_INTEGER);
        }
        var distanceScore = ((SplitTime.SCREENX / 3) / distance);
        
        if(dialog === engagedDialog) {
            return distanceScore * 1.5;
        }
        return distanceScore;
    }
}