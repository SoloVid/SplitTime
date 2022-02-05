import { Line } from "../spec/line";
import { SpeechBubbleState } from "./speech-bubble";
export class LineSpeechBubble {
    constructor(public readonly line: Line, public readonly speechBubble: SpeechBubbleState) { }
}
