import { SectionSpec } from "../spec/section-spec";
import { Line } from "../spec/line";
import { MidConversationAction } from "../spec/mid-conversation-action";
import { SectionSpecPart } from "../misc-types";
import { LineSequence } from "../spec/line-sequence";
type SectionSpecRawPart = SectionSpec | Line | MidConversationAction;
export function groupLineSequences(basicParts: readonly SectionSpecRawPart[]): SectionSpecPart[] {
    const formalizedParts: SectionSpecPart[] = [];
    let groupOfLines: Line[] = [];
    for (const part of basicParts) {
        if (part instanceof Line) {
            groupOfLines.push(part);
        }
        else {
            formalizedParts.push(new LineSequence(groupOfLines));
            groupOfLines = [];
            formalizedParts.push(part);
        }
    }
    formalizedParts.push(new LineSequence(groupOfLines));
    return formalizedParts;
}
