namespace splitTime.conversation {
    export function createSpecManager(
        gameLoop: GameLoop,
        perspective: Perspective,
        hud: ui.HUD,
        advanceEvent: body.CustomEventHandler<void>
    ): ConversationSpecManager {
        const helper = new HelperInfo(
            () => perspective.playerBody,
            advanceEvent
        )
        const renderer = new Renderer(perspective.camera)
        hud.pushRenderer(renderer)
        const secretary = new Secretary(renderer, perspective, helper)
        gameLoop.onFrameUpdate(secretary)
        const specManager = new ConversationSpecManager(helper, secretary)
        return specManager
    }
}
