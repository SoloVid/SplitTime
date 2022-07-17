namespace splitTime.conversation {
    export type ConversationLeafNode = SpeechBubbleContentsSpec | MidConversationAction
    export type SectionSpecPart = SectionSpec | LineSequence | MidConversationAction
    export type SetupFunc = (d: DSL) => void
    export type FancySetupFunc = (f: FancyDsl) => void
}
