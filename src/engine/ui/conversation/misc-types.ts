namespace splitTime.conversation {
    export type conversation_tree_pointer_t = readonly int[]
    export type outcome_t = { canceled: boolean, interrupted: boolean }
    export type SectionSpecRawPart = SectionSpec | Line | MidConversationAction
    export type SectionSpecPart = SectionSpec | LineSequence | MidConversationAction
    export type SetupFunc = (d: DSL) => void
}
