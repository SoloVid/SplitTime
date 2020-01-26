namespace SplitTime.conversation {
    export function createOrchestrator(gameLoop: GameLoop, perspective: Perspective, hud: ui.HUD): Orchestrator {
        const renderer = new Renderer(perspective.camera);
        hud.pushRenderer(renderer);
        const manager = new Manager(renderer, perspective);
        gameLoop.onFrameUpdate(manager);
        const orchestrator = new Orchestrator(manager);
        return orchestrator;
    }
}