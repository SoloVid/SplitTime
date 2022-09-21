import { PlayerParty } from "./player-party";
import { Perspective, SpriteBody, assert, direction_t, InFrontOfBody } from "../splitTime";
import { JoyStick } from "../ui/controls/joy-stick";
import { MeteredStat } from "./metered-stat";
import { PlayerAgent } from "./player-agent";
import * as splitTime from "../splitTime";
export class PlayerManager {
    party: PlayerParty;
    private _controlsLocked: boolean = false;
    constructor(public readonly perspective: Perspective, private readonly joyStick: JoyStick) {
        this.party = new PlayerParty(this);
    }
    makeAgent(spriteBody: SpriteBody, stamina?: MeteredStat): PlayerAgent {
        return new PlayerAgent(this, this.joyStick, spriteBody, stamina);
    }
    getActive(): PlayerAgent | null {
        return this.party.getActive();
    }
    getActiveBody(): splitTime.Body {
        const activeAgent = this.getActive();
        assert(activeAgent !== null, "activePlayerAgent is null");
        return activeAgent.body;
    }
    getLadderEvent(direction: direction_t): (body: splitTime.Body, eventId: string) => void {
        return (body: splitTime.Body, eventId: string) => {
            const agent = this.getActive();
            if (agent !== null && body === agent.body) {
                agent.setLadder(eventId, direction);
            }
        };
    }
    updatePlayerPerspective(): void {
        if (this.getActive() === null) {
            return;
        }
        this.perspective.playerBody = this.getActiveBody();
        this.perspective.camera.setFocusPoint(new InFrontOfBody(this.perspective.playerBody, Math.min(this.perspective.view.width, this.perspective.view.height) / 4));
    }
    get controlsLocked(): boolean {
        return this._controlsLocked;
    }
    set controlsLocked(locked: boolean) {
        this._controlsLocked = locked;
    }
}
