namespace SplitTime.conversation {
    export function createSpecManager(
        gameLoop: GameLoop,
        perspective: Perspective,
        hud: ui.HUD
    ): ConversationSpecManager {
        const renderer = new Renderer(perspective.camera)
        hud.pushRenderer(renderer)
        const secretary = new Secretary(renderer, perspective)
        gameLoop.onFrameUpdate(secretary)
        const helper = new RunnerHelper(
            secretary,
            () => perspective.playerBody
        )
        const specManager = new ConversationSpecManager(helper)
        return specManager
    }
}
