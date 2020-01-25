namespace SplitTime.dialog {
    export function createOrchestrator(gameLoop: GameLoop, perspective: Perspective, hud: ui.HUD): ConversationOrchestrator {
        const renderer = new Renderer(perspective.camera);
        hud.pushRenderer(renderer);
        const manager = new Manager(renderer, perspective);
        gameLoop.onFrameUpdate(manager);
        const orchestrator = new ConversationOrchestrator(manager);
        return orchestrator;
    }
}