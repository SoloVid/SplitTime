import { Sprite } from "engine/world/body/render/sprite";
import { SpriteBody } from "engine/world/body/sprite-body";
import { ControlledCollisionMovement } from "../world/body/agent/controlled-collision-movement-agent";
import { BehaviorChoice } from "./behavior-choice";
import { Body } from "engine/world/body/body";
export class Npc {
    public readonly movementAgent: ControlledCollisionMovement;
    constructor(public readonly spriteBody: SpriteBody, public readonly behavior: BehaviorChoice = new BehaviorChoice()) {
        this.movementAgent = new ControlledCollisionMovement(spriteBody);
        spriteBody.body.registerTimeAdvanceListener(delta => {
            this.movementAgent.notifyTimeAdvance(delta);
        });
    }
    get body(): Body {
        return this.spriteBody.body;
    }
    get sprite(): Sprite {
        return this.spriteBody.sprite;
    }
}
