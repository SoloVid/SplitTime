import { SpeechBox } from "../../world/body/speech-box";
import { Secretary } from "./runtime/secretary";
import { ConditionalBehavior } from "../../npc/conditional-behavior";
import { Body } from "engine/world/body/body"
import { game_seconds } from "engine/time/timeline";

export class Speaker {
    name: string = "";
    speechBox: SpeechBox;
    constructor(private readonly secretary: Secretary, public readonly body: Body) {
        // TODO: re-evaluate this speech box
        this.speechBox = new SpeechBox(body, body.height);
    }
    getBehavior(): ConditionalBehavior {
        return {
            isConditionMet: () => {
                return this.secretary.isSpeakerConversing(this);
            },
            notifyTimeAdvance(delta: game_seconds) {
                // Do nothing. The conversation manager system is handling the behavior.
            }
        };
    }
    isConversing(): boolean {
        return this.secretary.isSpeakerConversing(this);
    }
    shutUp(): void {
        const conversation = this.secretary.getConversationForSpeaker(this);
        if (conversation !== null) {
            this.secretary.pullOut(conversation, this);
        }
    }
}
