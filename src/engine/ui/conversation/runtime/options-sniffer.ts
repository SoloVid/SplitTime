namespace splitTime.conversation {
    export class OptionsSniffer {
        getEffectiveOptions(node: ConversationLeafNode): Options {
            const section = treeTraveler.getNearestParentSection(node)
            const parentOptions = this.getEffectiveSectionOptions(section)
            if (node instanceof Line) {
                return this.fillIn(node.options ?? {}, parentOptions)
            }
            return parentOptions
        }

        private getEffectiveSectionOptions(section: SectionSpec): Options {
            const sectionOptions = section.options ?? {}
            const parent = section.getParent()
            if (parent instanceof ConversationSpec) {
                return this.fillIn(sectionOptions, this.getDefaults())
            }
            return this.fillIn(sectionOptions, this.getEffectiveSectionOptions(parent))
        }

        private fillIn(partialOptions: Partial<Options>, defaultOptions: Options): Options {
            const options: Options = {
                importance: partialOptions.importance ?? defaultOptions.importance
            }

            return options
        }

        private getDefaults(): Options {
            return {
                importance: 1
            }
        }
    }

    export const optionsSniffer = new OptionsSniffer()
}