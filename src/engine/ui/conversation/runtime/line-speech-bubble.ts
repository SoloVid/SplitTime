namespace splitTime.conversation {
    export class LineSpeechBubble {
        constructor(
            public readonly line: SpeechBubbleContentsSpec,
            public readonly speechBubble: SpeechBubbleState
        ) {}
    }
}