namespace splitTime.conversation {
    export class ConversationSpec {
        constructor(
            public readonly id: string,
            public readonly topLevelSection: SectionSpec
        ) {}
    }
}