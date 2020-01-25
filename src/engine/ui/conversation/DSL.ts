namespace SplitTime.conversation {
    export interface DSL {
        say(speaker: Speaker, line: string): PromiseLike<Outcome>;
        section(setup: Function): SectionChain;
        cancelable(setup: Function): SectionChainThenable;
    }

    export interface SectionChain extends SectionChainInterruptible {
        cancelable(): SectionChainThenable;
    }

    export interface SectionChainInterruptible extends SectionChainThenable {
        // The modified section can be interrupted when the player interacts
        interruptible(condition?: any, callback?: Function): SectionChainInterruptible;
        // The modified section can be interrupted when the body is detected by some speaker
        interruptibleByDetection(body: Body, condition?: any, callback?: Function): SectionChainInterruptible;
    }

    interface SectionChainThenable {
        then(callback: (result: Outcome) => any): PromiseLike<Outcome>;
    }
}