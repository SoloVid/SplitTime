namespace splitTime.conversation {
    export type ConversationLeafNode = Line | MidConversationAction
    export type SectionSpecPart = SectionSpec | LineSequence | MidConversationAction
    export type SetupFunc = (d: DSL) => void
}
