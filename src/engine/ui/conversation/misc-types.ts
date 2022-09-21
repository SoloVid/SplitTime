import { DSL, FancyDsl } from "./spec/dsl";
import { SpeechBubbleContentsSpec } from "./spec/line";
import { LineSequence } from "./spec/line-sequence";
import { MidConversationAction } from "./spec/mid-conversation-action";
import { SectionSpec } from "./spec/section-spec";

export type FancySetupFunc = (f: FancyDsl) => void
export type ConversationLeafNode = SpeechBubbleContentsSpec | MidConversationAction
export type SectionSpecPart = SectionSpec | LineSequence | MidConversationAction;
export type SetupFunc = (d: DSL) => void;
