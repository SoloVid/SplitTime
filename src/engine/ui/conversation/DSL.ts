namespace SplitTime.conversation {
    export type condition_t = true | (() => boolean)

    export interface DSL {
        say(speaker: Speaker, line: string): void
        section(sectionSetup: () => void): SectionChain
        do(action: () => void): void
        waitUntil(condition: condition_t): void
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
            condition?: condition_t,
            sectionSetup?: () => void
        ): SectionChainInterruptible
        /**
         * The modified section can be interrupted when the body is detected by some speaker
         */
        interruptibleByDetection(
            condition?: condition_t,
            sectionSetup?: () => void,
            body?: Body
        ): SectionChainInterruptible
    }
}
