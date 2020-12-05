namespace splitTime.editor.level {
    export class GroupDisplayHelper {
        constructor(
            private readonly levelGetter: Indirect<Level>,
            private readonly groupGetter: Indirect<Group | undefined>
        ) {}

        private get level(): Level {
            return redirect(this.levelGetter)
        }

        private get group(): Group | undefined {
            return redirect(this.groupGetter)
        }

        get groupId(): string {
            return this.group?.obj.id || ""
        }
    
        get subGroups(): Group[] {
            return this.level.groups.filter(group => checkGroupMatch(this.level, this.groupId, group.obj.parent))
        }
        get traces(): Trace[] {
            return this.level.traces.filter(trace => inGroup(this.level, this.groupId, trace.obj))
        }
        get props(): Prop[] {
            return this.level.props.filter(prop => inGroup(this.level, this.groupId, prop.obj))
        }
        get positions(): Position[] {
            return this.level.positions.filter(pos => inGroup(this.level, this.groupId, pos.obj))
        }
        get allDisplayed(): boolean {
            return this.allSubGroupsDisplayed && this.allTracesDisplayed && this.allPropsDisplayed && this.allPositionsDisplayed
        }
        get allSubGroupsDisplayed(): boolean {
            return this.subGroupHelpers.every(g => {
                return g.allDisplayed
            })
        }
        get allTracesDisplayed(): boolean {
            return this.traces.every(trace => {
                return trace.metadata.displayed
            })
        }
        get allPropsDisplayed(): boolean {
            return this.props.every(prop => {
                return prop.metadata.displayed
            })
        }
        get allPositionsDisplayed(): boolean {
            return this.positions.every(pos => {
                return pos.metadata.displayed
            })
        }

        private get subGroupHelpers(): GroupDisplayHelper[] {
            return this.level.groups
                .filter(group => checkGroupMatch(this.level, this.groupId, group.obj.parent))
                .map(g => new GroupDisplayHelper(this.levelGetter, g))
        }

        private setAllDisplayed(displayed: boolean): void {
            this.subGroupHelpers.forEach(group => {
                group.setAllDisplayed(displayed)
            })
            this.traces.forEach(trace => {
                trace.metadata.displayed = !displayed
            })
            this.props.forEach(prop => {
                prop.metadata.displayed = !displayed
            })
            this.positions.forEach(pos => {
                pos.metadata.displayed = !displayed
            })
        }
        toggleAllDisplayed(): void {
            const displayed = this.allDisplayed
            this.setAllDisplayed(displayed)
        }
    }
}