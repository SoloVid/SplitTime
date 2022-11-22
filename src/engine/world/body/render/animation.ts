import { TimeNotified } from "engine/time/timeline";
import { RegisterCallbacks, Callback } from "engine/utils/register-callbacks";
import { Behavior } from "../../../npc/behavior";
import { debug } from "../../../utils/logger";
import { Sprite } from "./sprite";

const DUMMY_SECONDS = 2;
export class Animation implements TimeNotified, Behavior {
    private secondsPassed = 0;
    private callbackHandler = new RegisterCallbacks();
    constructor(private readonly sprite: Sprite, private readonly stance: string) {
    }
    notifyTimeAdvance(delta: number): void {
        // TODO: actually implement
        if (this.secondsPassed === 0) {
            debug("Playing animation " + this.stance);
        }
        this.secondsPassed += delta;
        if (this.isComplete()) {
            debug("Animation " + this.stance + " complete");
            this.callbackHandler.run();
        }
    }
    isComplete(): boolean {
        return this.secondsPassed > DUMMY_SECONDS;
    }
    onComplete(callback: Callback): void {
        this.callbackHandler.register(callback);
    }
    notifySuspension(): void {
        // TODO: implement (probably back to default)
        debug("Animation suspended");
    }
}
