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
 * Cache of dialogs in the current level
 * @type {SplitTime.Dialog[]}
 */
var currentLevelDialogs = [];

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
        }
    }
};

/**
 * This method should be used sparingly, essentially only for major plot points.
 * This method allows a new dialog to take precedence over one which is actively engaged.
 */
SplitTime.DialogManager.disengageAllDialogs = function() {
    engagedDialog = null;
};

SplitTime.DialogManager.notifyFrameUpdate = function() {
    var currentLevel = SplitTime.Level.getCurrent();
    var currentRegion = currentLevel.getRegion();
    currentLevelDialogs = [];

    var reigningChampionScore = engagedDialog ? calculateDialogImportanceScore(engagedDialog) : 0;
    var usurper = null;

    for(var i = 0; i < dialogs.length; i++) {
        var location = dialogs[i].getLocation();
        var level = location.getLevel();
        if(level.getRegion() === currentRegion) {
            dialogs[i].notifyFrameUpdate();
            if(level === currentLevel) {
                currentLevelDialogs.push(dialogs[i]);
                var score = calculateDialogImportanceScore(dialogs[i]);
                if(score > reigningChampionScore) {
                    usurper = dialogs[i];
                    reigningChampionScore = score;
                }
            }
        }
    }

    if(usurper !== null) {
        SplitTime.Dialog.Renderer.hide(engagedDialog);
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
    var distanceScore = SplitTime.SCREENX / distance;

    if(dialog === engagedDialog) {
        return distanceScore * 100;
    }
    return distanceScore;
}
