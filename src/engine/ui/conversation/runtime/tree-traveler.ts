namespace splitTime.conversation {
    /**
     * Helper class for navigating forward through the conversation tree.
     */
    export class TreeTraveler {
        getFirst(section: SectionSpec): ConversationLeafNode | null {
            for (const part of section.parts) {
                const first = this.getFirstOfSectionPart(part)
                if (first !== null) {
                    return first
                }
            }
            return null
        }

        getNextAfter(node: ConversationLeafNode): ConversationLeafNode | null {
            if (node instanceof SpeechBubbleContentsSpec) {
                return this.getNextAfterLine(node)
            }
            return this.getNextAfterSectionPart(node)
        }

        getCanceledFrom(node: ConversationLeafNode): ConversationLeafNode | null {
            let current: SectionSpec | null = this.getNearestParentSection(node)
            // Quit when we get to the root of the tree
            while (current !== null) {
                if (current.cancelSection !== null) {
                    const cancelNext = this.getFirst(current.cancelSection)
                    if (cancelNext !== null) {
                        return cancelNext
                    }
                    return this.getNextAfterSectionPart(current)
                }
                // Move up tree
                current = this.getNearestParentSection(current)
            }
            return null
        }

        getInterruptedFrom(event: body.CustomEventHandler<void>, node: ConversationLeafNode): ConversationLeafNode | null {
            let current: SectionSpec | null = this.getNearestParentSection(node)
            // Quit when we get to the root of the tree
            while (current !== null) {
                for (const interruptible of current.interruptibles) {
                    if (interruptible.events.indexOf(event) < 0 || !interruptible.conditionMet) {
                        continue
                    }
                    if (interruptible.section) {
                        return this.getFirst(interruptible.section)
                    }
                    return this.getNextAfterSectionPart(current)
                }
                // Move up tree
                current = this.getNearestParentSection(current)
            }
            return null
        }

        private getNextAfterLine(node: SpeechBubbleContentsSpec): ConversationLeafNode | null {
            const lineSequence = node.getParent()
            const thisIndex = lineSequence.lines.indexOf(node)
            const nextIndex = thisIndex + 1
            if (nextIndex < lineSequence.lines.length) {
                return lineSequence.lines[nextIndex]
            }
            return this.getNextAfterSectionPart(lineSequence)
        }

        private getNextAfterSectionPart(node: SectionSpecPart): ConversationLeafNode | null {
            const parent = node.getParent()
            if (parent instanceof ConversationSpec) {
                return null
            }
            const thisIndex = parent.parts.indexOf(node)
            // We must be talking about a cancel or interrupt section
            if (thisIndex < 0) {
                return this.getNextAfterSectionPart(parent)
            }
            let nextIndex = thisIndex + 1
            while (nextIndex < parent.parts.length) {
                const nextPart = parent.parts[nextIndex++]
                const maybeNext = this.getFirstOfSectionPart(nextPart)
                if (maybeNext !== null) {
                    return maybeNext
                }
            }
            return this.getNextAfterSectionPart(parent)
        }

        private getFirstOfSectionPart(node: SectionSpecPart): ConversationLeafNode | null {
            if (node instanceof MidConversationAction) {
                return node
            }
            if (node instanceof LineSequence) {
                if (node.lines.length === 0) {
                    return null
                }
                return node.lines[0]
            }
            if (node instanceof SectionSpec) {
                return this.getFirst(node)
            }
            assertNever(node, "Unexpected section part type")
        }

        getNearestParentSection(node: ConversationLeafNode): SectionSpec
        getNearestParentSection(node: LineSequence | SectionSpec): SectionSpec | null
        getNearestParentSection(node: SectionSpecPart | SpeechBubbleContentsSpec): SectionSpec | null {
            const parent = node.getParent()
            if (parent instanceof SectionSpec) {
                return parent
            }
            if (parent instanceof ConversationSpec) {
                return null
            }
            return parent.getParent()
        }
    }

    export const treeTraveler = new TreeTraveler()
}