namespace splitTime.conversation {
    export class LineSpeechBubble {
        constructor(
            public readonly line: Line,
            public readonly speechBubble: SpeechBubbleState
        ) {}
    }
}