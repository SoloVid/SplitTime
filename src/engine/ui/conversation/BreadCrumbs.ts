namespace SplitTime.conversation {
    type ActionCrumb = Line | MidConversationAction
    type ObjectContainerCrumb = SectionSpec | LineSequence | InterruptibleSpec
    type NonArrayCrumb = ActionCrumb | ObjectContainerCrumb
    type Crumb = SpotInArray | NonArrayCrumb
    class SpotInArray {
        constructor(
            public readonly array: readonly NonArrayCrumb[],
            public readonly index: int
        ) {}
    }

    export class BreadCrumbs {
        public readonly crumbs: readonly Crumb[]

        constructor(startSection: SectionSpec)
        constructor(crumbs: readonly Crumb[])
        constructor(sectionOrCrumbs: SectionSpec | readonly Crumb[]) {
            if(sectionOrCrumbs instanceof SectionSpec) {
                const crumbs = this.getCrumbsForSectionStart(sectionOrCrumbs)
                if(crumbs === null) {
                    throw new Error("Cannot make bread crumbs for section")
                }
                this.crumbs = crumbs
            } else {
                this.crumbs = sectionOrCrumbs
            }
            // FTODO: maybe add more crumb validation
            const lastCrumb = this.crumbs[this.crumbs.length - 1]
            assert(
                lastCrumb instanceof Line || lastCrumb instanceof MidConversationAction,
                "Last bread crumb needs to be some actionable item"
            )
        }

        getActionItem(): ActionCrumb {
            return this.crumbs[this.crumbs.length - 1] as ActionCrumb
        }

        equals(otherBreadCrumbs: BreadCrumbs): boolean {
            if(this === otherBreadCrumbs) {
                return true
            }
            const otherCrumbs = otherBreadCrumbs.crumbs
            if(this.crumbs.length !== otherCrumbs.length) {
                return false
            }
            return this.crumbs.every((crumb, i) => {
                const otherCrumb = otherCrumbs[i]
                if(crumb instanceof SpotInArray) {
                    if(otherCrumb instanceof SpotInArray) {
                        return crumb.array === otherCrumb.array && crumb.index === otherCrumb.index
                    } else {
                        return false
                    }
                }
                return crumb === otherCrumb
            })
        }

        getNext(): BreadCrumbs | null {
            return this.getNextRelative(this.crumbs)
        }

        private getNextRelative(crumbs: readonly Crumb[]): BreadCrumbs | null {
            for(let i = crumbs.length - 1; i >= 0; i--) {
                const crumb = crumbs[i]
                if(crumb instanceof InterruptibleSpec) {
                    // Skip past next array since we don't want to go successively through interruptibles
                    i--;
                    continue;
                }
                if(crumb instanceof SpotInArray) {
                    const array = crumb.array
                    for(let nextIndex = crumb.index + 1; nextIndex < array.length; nextIndex++) {
                        const nextCrumb = this.createDerivativeCrumb(i, array, nextIndex)
                        if(nextCrumb !== null) {
                            return nextCrumb
                        }
                    }
                }
            }
            return null
        }

        getNextCanceled(): BreadCrumbs | null {
            for(let iCrumb = this.crumbs.length - 1; iCrumb >= 0; iCrumb--) {
                const crumb = this.crumbs[iCrumb]
                if(crumb instanceof SectionSpec && crumb.cancelSection) {
                    const nextCrumbs = this.getCrumbsForSectionStart(crumb.cancelSection)
                    if(nextCrumbs !== null) {
                        return new BreadCrumbs(nextCrumbs)
                    }
                    return this.getNextRelative(this.crumbs.slice(iCrumb + 1))
                }
            }
            throw new Error("No cancellation (not found in hierarchy related to these bread crumbs)")
        }

        getNextInterrupted(interruptible: InterruptibleSpec): BreadCrumbs | null {
            for(let iCrumb = this.crumbs.length - 1; iCrumb >= 0; iCrumb--) {
                const crumb = this.crumbs[iCrumb]
                if(crumb instanceof SectionSpec) {
                    const plainInterruptibleBreadCrumbs = this.searchArrayForInterruptedBreadCrumbs(iCrumb + 1, interruptible, crumb.interruptibles)
                    const detectionInterruptibleBreadCrumbs = this.searchArrayForInterruptedBreadCrumbs(iCrumb + 1, interruptible, crumb.detectionInterruptibles)
                    return plainInterruptibleBreadCrumbs || detectionInterruptibleBreadCrumbs
                }
            }
            throw new Error("Invalid interruptible (not found in hierarchy related to these bread crumbs)")
        }

        private searchArrayForInterruptedBreadCrumbs(iSlice: int, interruptible: InterruptibleSpec, interruptibles: readonly InterruptibleSpec[]): BreadCrumbs | null {
            for(let i = 0; i < interruptibles.length; i++) {
                if(interruptible === interruptibles[i]) {
                    const baseCrumbs = this.crumbs.slice(0, iSlice)
                    baseCrumbs.push(interruptible)
                    let subCrumbs: readonly Crumb[] | null = null
                    if(interruptible.section !== null) {
                        baseCrumbs.push(interruptible.section)
                        subCrumbs = this.getCrumbsForSectionStart(interruptible.section)
                    }
                    if(subCrumbs !== null) {
                        return new BreadCrumbs(baseCrumbs.concat(subCrumbs))
                    } else {
                        return this.getNextRelative(baseCrumbs)
                    }
                }
            }
            return null
        }

        private createDerivativeCrumb(iSlice: int, array: readonly NonArrayCrumb[], nextIndex: int): BreadCrumbs | null {
            const nextCrumbs = this.crumbs.slice(0, iSlice)
            nextCrumbs.push(new SpotInArray(array, nextIndex))
            const lastCrumb = array[nextIndex]
            nextCrumbs.push(lastCrumb)
            if(!(lastCrumb instanceof Line || lastCrumb instanceof MidConversationAction)) {
                if(lastCrumb instanceof InterruptibleSpec) {
                    throw new Error("It should be impossible to get an InterruptibleSpec here")
                }
                const sectionStartCrumbs = this.getCrumbsForSectionStart(lastCrumb)
                if(sectionStartCrumbs === null) {
                    return null
                }
                for(const crumb of sectionStartCrumbs) {
                    nextCrumbs.push(crumb)
                }
            }
            return new BreadCrumbs(nextCrumbs)
        }

        private getCrumbsForSectionStart(section: SectionSpec | LineSequence): readonly Crumb[] | null {
            if(section instanceof LineSequence) {
                if(section.lines.length === 0) {
                    return null
                }
                return this.createArrayElementTuple(section.lines, 0)
            } else {
                for(let i = 0; i < section.parts.length; i++) {
                    const baseCrumbs = this.createArrayElementTuple(section.parts, i)
                    const part = section.parts[i]
                    if(part instanceof MidConversationAction) {
                        return baseCrumbs
                    }
                    const subCrumbs = this.getCrumbsForSectionStart(part)
                    if(subCrumbs !== null) {
                        return baseCrumbs.concat(subCrumbs)
                    }
                }
                return null
            }
        }

        private createArrayElementTuple(array: readonly NonArrayCrumb[], i: int): [SpotInArray, NonArrayCrumb] {
            return [
                new SpotInArray(array, i),
                array[i]
            ]
        }
    }
}