import { Line } from "../spec/line";
import { SpeechBubbleState } from "./speech-bubble";
export class LineSpeechBubble {
    constructor(public readonly line: SpeechBubbleContentsSpec, public readonly speechBubble: SpeechBubbleState) { }
}
