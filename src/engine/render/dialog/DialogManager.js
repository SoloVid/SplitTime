/**
 * Serves as a point of contact for all dialog-related decisions
 *
 * For example:
 * - Give Dialog objects a chance to update themselves.
 * - Choose which Dialog object(s) should display on the screen (and push to DialogRenderer).
 * - Delegate screen interactions from the player to appropriate Dialog objects.
 */
SplitTime.DialogManager = {};

/**
 * @type {SplitTime.Dialog[]}
 */
var dialogs = [];

/**
 * If a dialog has been engaged, it will be stored here.
 * @type {SplitTime.Dialog|null}
 */
var engagedDialog = null;

/**
 * Allow dialog manager to start managing the dialog.
 * @param {SplitTime.Dialog} dialog
 */
SplitTime.DialogManager.submit = function(dialog) {
    if(dialogs.indexOf(dialog) < 0) {
        dialogs.push(dialog);
    }
};

/**
 * Stop dialog manager from managing the dialog.
 * @param {SplitTime.Dialog} dialog
 */
SplitTime.DialogManager.remove = function(dialog) {
    for(var i = dialogs.length - 1; i >= 0; i--) {
        if(dialogs[i] === dialog) {
            dialogs.splice(i, 1);
            SplitTime.Dialog.Renderer.hide(dialog);
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
SplitTime.DialogManager.disengageAllDialogs = function() {
    engagedDialog = null;
};

var MIN_SCORE = 0;

SplitTime.DialogManager.notifyFrameUpdate = function() {
    var currentLevel = SplitTime.Level.getCurrent();
    var currentRegion = currentLevel.getRegion();

    var engagedScore = engagedDialog ? calculateDialogImportanceScore(engagedDialog) : MIN_SCORE;
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

    if(winningScore > engagedScore) {
        SplitTime.Dialog.Renderer.hide(engagedDialog);
        engagedDialog = null;
    }

    if(usurper !== null) {
        engagedDialog = usurper;
        SplitTime.Dialog.Renderer.show(engagedDialog);
    }

    SplitTime.Dialog.Renderer.notifyFrameUpdate();
};

/**
 * @param {SplitTime.Dialog} dialog
 */
function calculateDialogImportanceScore(dialog) {
    if(dialog.getLocation().getLevel() !== SplitTime.Level.getCurrent()) {
        return 0;
    }

    var player = SplitTime.Player.getActiveBody();
    var location = dialog.getLocation();

    var distance = SplitTime.Measurement.distanceEasy(player.getX(), player.getY(), location.getX(), location.getY());
    var distanceScore = ((SplitTime.SCREENX / 2) / distance) - 1;

    if(dialog === engagedDialog) {
        return distanceScore * 2;
    }
    return distanceScore;
}
