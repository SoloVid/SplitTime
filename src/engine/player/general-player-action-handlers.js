dependsOn("Controls.js");

var Button = SplitTime.Controls.Button;

var INTERACT_FUDGE = 16;

Button.PRIMARY_INTERACT.onUp(function() {
    // This file is only concerned with ACTION state; so don't do anything if the state is something else.
    if(SplitTime.process !== SplitTime.main.State.ACTION) {
        return;
    }

    var possibleInteractions = getPossibleInteractions();

    /** @type {{body: SplitTime.Body, score: number}|null} */
    var chosenInteraction = null;
    var highestScore = 0;
    for(var i = 0; i < possibleInteractions.length; i++) {
        var interaction = possibleInteractions[i];
        if(interaction.score > highestScore) {
            chosenInteraction = interaction;
            highestScore = interaction.score;
        }
    }
    if(chosenInteraction) {
        chosenInteraction.body.notifyPlayerInteract();
    }
});

/**
 * @return {{body: SplitTime.Body, score: number}[]}
 */
function getPossibleInteractions() {
    var playerBody = SplitTime.Player.getActiveBody();
    var level = playerBody.getLevel();
    var levelBodies = level.getBodies();
    var possibleInteractions = [];
    for(var i = 0; i < levelBodies.length; i++) {
        var howLikely = howLikelyIsPlayerInteracting(playerBody, levelBodies[i]);
        if(howLikely > 0) {
            possibleInteractions.push({
                score: howLikely,
                body: levelBodies[i]
            });
        }
    }
    return possibleInteractions;
}

/**
 * @param {SplitTime.Body} playerBody
 * @param {SplitTime.Body} otherBody
 * @return {number}
 */
function howLikelyIsPlayerInteracting(playerBody, otherBody) {
    if(otherBody === playerBody) {
        return 0;
    }
    var dist = SplitTime.Measurement.distanceTrue(playerBody.getX(), playerBody.getY(), otherBody.getX(), otherBody.getY());
    var distBetweenBases = dist - (playerBody.baseLength / 2) - (otherBody.baseLength / 2);
    if(distBetweenBases > INTERACT_FUDGE) {
        return 0;
    }
    if(!SplitTime.Direction.areWithin90Degrees(playerBody.dir, SplitTime.Direction.fromTo(playerBody, otherBody))) {
        return 0;
    }
    return INTERACT_FUDGE - distBetweenBases;
}