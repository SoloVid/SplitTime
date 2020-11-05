namespace splitTime.conversation {
    export function groupLineSequences(basicParts: readonly SectionSpecRawPart[]): SectionSpecPart[] {
        const formalizedParts: SectionSpecPart[] = []
        let groupOfLines: Line[] = []
        for (const part of basicParts) {
            if (part instanceof Line) {
                groupOfLines.push(part)
            } else {
                formalizedParts.push(new LineSequence(groupOfLines))
                groupOfLines = []
                formalizedParts.push(part)
            }
        }
        formalizedParts.push(new LineSequence(groupOfLines))
        return formalizedParts
    }
}