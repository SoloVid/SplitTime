import { ControlledCollisionMovement } from "../world/body/agent/controlled-collision-movement-agent";
import { SpriteBody, Sprite } from "../splitTime";
import { BehaviorChoice } from "./behavior-choice";
import * as splitTime from "../splitTime";
export class Npc {
    public readonly movementAgent: ControlledCollisionMovement;
    constructor(public readonly spriteBody: SpriteBody, public readonly behavior: BehaviorChoice = new BehaviorChoice()) {
        this.movementAgent = new ControlledCollisionMovement(spriteBody);
        spriteBody.body.registerTimeAdvanceListener(delta => {
            this.movementAgent.notifyTimeAdvance(delta);
        });
    }
    get body(): splitTime.Body {
        return this.spriteBody.body;
    }
    get sprite(): Sprite {
        return this.spriteBody.sprite;
    }
}
