namespace splitTime.conversation {
    export type Condition = true | (() => boolean)

    export interface DSL {
        say(speaker: Speaker, line: string): void
        section(sectionSetup: () => void): SectionChain
        do(action: MidConversationCallback): void
        // waitUntil(condition: Condition): void
    }

    export interface SectionChain extends SectionChainInterruptible {
        /**
         * The modified section can be canceled when the player walks away
         */
        cancelable(sectionSetup?: () => void): void
    }

    export interface SectionChainInterruptible {
        /**
         * The modified section can be interrupted when the player interacts
         */
        interruptible(
            condition?: Condition,
            sectionSetup?: () => void
        ): SectionChainInterruptible
        /**
         * The modified section can be interrupted when the body is detected by some speaker
         */
        interruptibleByDetection(
            condition?: Condition,
            sectionSetup?: () => void,
            body?: Body
        ): SectionChainInterruptible
    }
}
