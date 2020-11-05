namespace splitTime.conversation {
    export class ConversationSpec {
        // Prevent class from being used as interface
        private _ = null
        constructor(
            public readonly id: string,
            public readonly topLevelSection: SectionSpec
        ) {
            topLevelSection.setParent(this)
        }
    }
}