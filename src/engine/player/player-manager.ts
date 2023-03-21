import { PlayerParty } from "./player-party";
import { JoyStick } from "../ui/controls/joy-stick";
import { MeteredStat } from "./metered-stat";
import { PlayerAgent } from "./player-agent";
import { assert } from "globals";
import { direction_t } from "engine/math/direction";
import { Perspective } from "engine/perspective";
import { InFrontOfBody } from "engine/world/body/in-front-of-body";
import { SpriteBody } from "engine/world/body/sprite-body";
import { Body } from "engine/world/body/body";

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
    getActiveBody(): Body {
        const activeAgent = this.getActive();
        assert(activeAgent !== null, "activePlayerAgent is null");
        return activeAgent.body;
    }
    getLadderEvent(direction: direction_t): (body: Body, eventId: string) => void {
        return (body: Body, eventId: string) => {
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
        this.perspective.camera.setFocusPoint(this.perspective.playerBody);
        // this.perspective.camera.setFocusPoint(new InFrontOfBody(this.perspective.playerBody, Math.min(this.perspective.view.width, this.perspective.view.height) / 4));
    }
    get controlsLocked(): boolean {
        return this._controlsLocked;
    }
    set controlsLocked(locked: boolean) {
        this._controlsLocked = locked;
    }
}
