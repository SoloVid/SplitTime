import { ConversationSpecManager } from "./spec/conversation-spec-manager";
import { Secretary } from "./runtime/secretary";
import { SetupFunc } from "./misc-types";
import { Options } from "./spec/dsl";
import { EventSpec } from "../../time/event-spec";
import { Speaker } from "./speaker";
import * as splitTime from "../../splitTime";
export class ConversationLiaison {
    constructor(private readonly specManager: ConversationSpecManager, private readonly secretary: Secretary) { }
    register(id: string, setup: SetupFunc, options?: Partial<Options>): EventSpec<void> {
        return this.specManager.register(id, setup, options);
    }
    makeSpeaker(body: splitTime.Body): Speaker {
        return new Speaker(this.secretary, body);
    }
    tryAdvance(): true | void {
        const engagedConversation = this.secretary.getEngagedConversation();
        if (engagedConversation !== null) {
            this.secretary.advance(engagedConversation);
            return true;
        }
    }
}
