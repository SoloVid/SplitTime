import { HUD } from "../viewport/hud";
import { CustomEventHandler } from "../../world/body/custom-event-handler";
import { ConversationLiaison } from "./conversation-liaison";
import { HelperInfo } from "./runtime/helper-info";
import { Renderer } from "./runtime/renderer";
import { Secretary } from "./runtime/secretary";
import { ConversationSpecManager } from "./spec/conversation-spec-manager";
import { GameLoop } from "engine/game-loop";
import { Perspective } from "engine/perspective";

export function createLiaison(gameLoop: GameLoop, perspective: Perspective, hud: HUD, advanceEvent: CustomEventHandler<void>): ConversationLiaison {
    const helper = new HelperInfo(() => perspective.playerBody, advanceEvent);
    const renderer = new Renderer(perspective.camera);
    hud.pushRenderer(renderer);
    const secretary = new Secretary(renderer, perspective, helper);
    gameLoop.onFrameUpdate(secretary);
    const specManager = new ConversationSpecManager(inst => secretary.submitConversation(inst));
    return new ConversationLiaison(specManager, secretary);
}
