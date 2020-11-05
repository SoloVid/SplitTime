namespace splitTime.conversation {
    export class TreeTraveler {
        getFirst(section: SectionSpec): ConversationLeafNode | null {
            if (section.parts.length === 0) {
                return null
            }
            return this.getFirstOfSectionPart(section.parts[0])
        }

        getNextAfter(node: ConversationLeafNode): ConversationLeafNode | null {
            if (node instanceof Line) {
                return this.getNextAfterLine(node)
            }
            return this.getNextAfterSectionPart(node)
        }

        getCanceledFrom(node: ConversationLeafNode): ConversationLeafNode | null {
            let current = this.getNearestParentSection(node)
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

        getInterruptedFrom(type: string, node: ConversationLeafNode): ConversationLeafNode | null {
            let current = this.getNearestParentSection(node)
            // Quit when we get to the root of the tree
            while (current !== null) {
                for (const interruptible of current.interruptibles) {
                    if (interruptible.type !== type || !interruptible.conditionMet) {
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

        private getNextAfterLine(node: Line): ConversationLeafNode | null {
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

        private getNearestParentSection(node: SectionSpecPart | Line): SectionSpec | null {
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
}