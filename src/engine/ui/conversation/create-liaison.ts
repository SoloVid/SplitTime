namespace splitTime.conversation {
    export function createLiaison(
        gameLoop: GameLoop,
        perspective: Perspective,
        hud: ui.HUD,
        advanceEvent: body.CustomEventHandler<void>
    ): ConversationLiaison {
        const helper = new HelperInfo(
            () => perspective.playerBody,
            advanceEvent
        )
        const renderer = new Renderer(perspective.camera)
        hud.pushRenderer(renderer)
        const secretary = new Secretary(renderer, perspective, helper)
        gameLoop.onFrameUpdate(secretary)
        const specManager = new ConversationSpecManager(inst => secretary.submitConversation(inst))
        return new ConversationLiaison(specManager, secretary)
    }
}
