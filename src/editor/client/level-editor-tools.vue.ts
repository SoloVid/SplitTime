namespace splitTime.editor.level {
    interface VueLevelEditorTools extends VueComponent {
        // props
        levelEditorShared: LevelEditorShared
        // data
        traceOptions: {
            type: string,
            color: string,
            help: string
        }[]
        // computed
        level: Level
        // methods
        selectModeOption(mode: Mode): void
        selectTraceOption(type: string): void
    }

    function level(this: VueLevelEditorTools): Level {
        return this.levelEditorShared.level
    }

    function selectModeOption(this: VueLevelEditorTools, mode: Mode): void {
        this.levelEditorShared.setMode(mode)
    }
    function selectTraceOption(this: VueLevelEditorTools, type: string): void {
        this.levelEditorShared.setMode("trace", type)
    }

    // defer necessary for traceOptions
    defer(() => {
        Vue.component("level-editor-tools", {
            props: {
                levelEditorShared: Object
            },
            data: function() {
                return {
                    traceOptions
                }
            },
            computed: {
                level
            },
            methods: {
                selectModeOption,
                selectTraceOption
            },
            template: `
<div>
    Tools:
    <div class="option"
        v-on:click="selectModeOption('position')"
        title="Positions are handles for locations that Actors may occupy or paths may lead to and from.&#013;&#013;NPCs are generally people or things that have dynamic properties.&#013;NPCs are loaded at game start and transcend the board (i.e. they are not actually tied to the board and may be moved to other boards).
        &#013;Right-click to create new.&#013;Left-click to drag.&#013;Shift+left-click to clone.&#013;Double-click to open properties."
        >Position</div>
    <div class="option"
        v-on:click="selectModeOption('prop')"
        title="Props are loaded on level entrance and are destroyed on level exit. They are used in few processes, and slow down performance less than NPCs&#013;Props are generally static (or animated) graphical elements Bodys can walk behind or in front of.
        &#013;Right-click to create new.&#013;Left-click to drag.&#013;Shift+left-click to clone&#013;Double-click to open properties."
        >Prop</div>
    <br>
    Active Layer:
    <select id="activeLayer" v-model="levelEditorShared.activeLayer">
        <option
            v-for="(layer, index) in levelEditorShared.level.layers"
            :value="index"
        >{{ layer.id || ("Layer " + index) }}</option>
    </select>
    <br><br>
    <div id="traceOptions">
        <span title="Traces define Bodys' (actually just NPCs and players) interaction with the level.&#013;
            &#013;Right-click to create new.&#013;Left-click to add points to started trace.&#013;Right-click to close trace (and fill in), or shift+right-click to end trace without filling in.&#013;Left-click to drag.&#013;Shift+left-click to clone.&#013;Double-click to open properties.">Traces</span>
        <div v-for="(traceOption) in traceOptions"
            :key="traceOption.type"
            class="option"
            :style="{ color: 'white', backgroundColor: traceOption.color }"
            v-on:click="selectTraceOption(traceOption.type)"
            :title="traceOption.help"
        >
            {{ traceOption.type }}
        </div>
    </div>
</div>
            `
        })
    })
}