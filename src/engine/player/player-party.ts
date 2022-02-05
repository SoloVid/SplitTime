import { PlayerAgent } from "./player-agent";
import { PlayerManager } from "./player-manager";
export class PlayerParty {
    private activePlayerAgent: PlayerAgent | null = null;
    private available: PlayerAgent[] = [];
    constructor(public readonly playerManager: PlayerManager) { }
    add(playerAgent: PlayerAgent): void {
        this.available.push(playerAgent);
    }
    clear(): void {
        this.available = [];
    }
    swap(playerAgentOut: PlayerAgent, playerAgentIn: PlayerAgent): void {
        for (let i = 0; i < this.available.length; i++) {
            if (this.available[i] === playerAgentOut) {
                this.available.splice(i, 1, playerAgentIn);
            }
        }
        if (this.getActive() === playerAgentOut) {
            this.setActive(playerAgentIn);
        }
    }
    getActive(): PlayerAgent | null {
        return this.activePlayerAgent;
    }
    setActive(playerAgent: PlayerAgent): void {
        Promise.resolve().then(() => {
            this.activePlayerAgent = playerAgent;
            this.playerManager.updatePlayerPerspective();
        });
    }
}
