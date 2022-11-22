import { CustomEventHandler } from "../world/body/custom-event-handler";
import { distanceTrue } from "../math/measurement";
import { areWithin90Degrees, fromToThing } from "../math/direction";
import { Body } from "engine/world/body/body";

const INTERACT_FUDGE = 16;
export function tryPlayerInteract(playerBody: Body, event: CustomEventHandler<void>): true | void {
    var possibleInteractions = getPossibleInteractions(playerBody);
    var chosenInteraction: {
        body: Body;
        score: number;
    } | null = null;
    var highestScore = 0;
    for (var i = 0; i < possibleInteractions.length; i++) {
        var interaction = possibleInteractions[i];
        if (event.hasListener(interaction.body) && interaction.score > highestScore) {
            chosenInteraction = interaction;
            highestScore = interaction.score;
        }
    }
    if (chosenInteraction) {
        // TODO: This is awkward
        event.trigger(chosenInteraction.body);
        return true;
    }
}
export function getPossibleInteractions(playerBody: Body): {
    body: Body;
    score: number;
}[] {
    var level = playerBody.getLevel();
    var levelBodies = level.getBodies();
    var possibleInteractions = [];
    for (var i = 0; i < levelBodies.length; i++) {
        var howLikely = howLikelyIsPlayerInteracting(playerBody, levelBodies[i]);
        if (howLikely > 0) {
            possibleInteractions.push({
                score: howLikely,
                body: levelBodies[i]
            });
        }
    }
    return possibleInteractions;
}
export function howLikelyIsPlayerInteracting(playerBody: Body, otherBody: Body): number {
    if (otherBody === playerBody) {
        return 0;
    }
    var dist = distanceTrue(playerBody.getX(), playerBody.getY(), otherBody.getX(), otherBody.getY());
    // TODO: account for depth and height in addition to width
    var distBetweenBases = dist - playerBody.width / 2 - otherBody.width / 2;
    if (distBetweenBases > INTERACT_FUDGE) {
        return 0;
    }
    if (!areWithin90Degrees(playerBody.dir, fromToThing(playerBody, otherBody))) {
        return 0;
    }
    return INTERACT_FUDGE - distBetweenBases;
}
