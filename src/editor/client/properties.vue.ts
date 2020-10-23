namespace splitTime.editor.client {
    export interface FieldOptions {
        readonly?: boolean
        title?: string
        isFile?: boolean
        fileBrowserRoot?: string
    }

    export interface ObjectProperties {
        title: string,
        thing: { [key: string]: string | number }
        fields: { [key: string]: FieldOptions }
    }

    interface VueObjectProperties {
        // props
        editorGlobalStuff: client.GlobalEditorShared
        title: string,
        thing: { [key: string]: string | number }
        fields: { [key: string]: FieldOptions }
    }

    type InputType = "string" | "textarea" | "number" | "file"
    interface VueObjectProperty {
        // props
        editorGlobalStuff: client.GlobalEditorShared
        thing: { [key: string]: unknown }
        fieldKey: string
        fieldOptions: FieldOptions
        // data
        isTempEmpty: boolean
        // computed
        propertyExists: boolean
        rawValue: string | number
        title: string
        value: unknown
        inputType: InputType
        isReadonly: boolean
        // methods
        launchFileBrowser(): void
    }

    function data(this: VueObjectProperty) {
        return {
            isTempEmpty: false
        }
    }

    function propertyExists(this: VueObjectProperty): boolean {
        return this.fieldKey in this.thing
    }

    function getRawValue(this: VueObjectProperty): string | number {
        if (!this.propertyExists) {
            throw new Error("Can't access raw value (" + this.fieldKey + ") when it doesn't exist!")
        }
        // if (this.isTempEmpty) {
        //     return ""
        // }
        const value = this.thing[this.fieldKey]
        if (typeof value !== "number" && typeof value !== "string") {
            throw new Error("Value (" + this.fieldKey + ") isn't a string or number")
        }
        return value
    }

    function setRawValue(this: VueObjectProperty, newValue: unknown): void {
        if (!this.propertyExists) {
            throw new Error("Can't access raw value (" + this.fieldKey + ") when it doesn't exist!")
        }
        const oldValue = this.rawValue
        if (typeof newValue !== typeof oldValue) {
            if (typeof oldValue === "number" && !newValue) {
                this.isTempEmpty = true
                return
            }
            throw new Error("Can't set value (" + this.fieldKey + ") to different type")
        }
        this.thing[this.fieldKey] = newValue
        this.isTempEmpty = false
    }

    function title(this: VueObjectProperty): string {
        return this.fieldOptions.title || this.fieldKey
    }

    function getValue(this: VueObjectProperty): unknown {
        return this.rawValue
    }

    function setValue(this: VueObjectProperty, value: unknown): void {
        if (typeof value === "number" || typeof value === "string") {
            this.rawValue = value
        }
    }

    function inputType(this: VueObjectProperty): InputType {
        if (typeof this.rawValue === "number") {
            return "number"
        }
        if (typeof this.rawValue === "string") {
            if (this.fieldOptions.isFile) {
                return "file"
            }
            const TEXTAREA_THRESHOLD = 32
            if (this.rawValue.length > TEXTAREA_THRESHOLD) {
                return "textarea"
            }
            return "string"
        }
        throw new Error("Property (" + this.fieldKey + ") is not a number or string")
    }

    async function launchFileBrowser(this: VueObjectProperty): Promise<void> {
        const root = this.fieldOptions.fileBrowserRoot || ""
        const filePath = await this.editorGlobalStuff.openFileSelect(root)
        this.value = filePath.replace(root + "/", "")
    }

    function isReadonly(this: VueObjectProperty): boolean {
        return !!this.fieldOptions.readonly
    }

    Vue.component("object-properties", {
        props: {
            editorGlobalStuff: Object,
            title: String,
            thing: Object,
            fields: Object
        },
        computed: {
        },
        methods: {
        },
        template: `
<div>
    <h4>{{ title }}</h4>
    <object-property
        v-for="(fieldOptions, key) in fields"
        :key="title + key"
        :editor-global-stuff="editorGlobalStuff"
        :thing="thing"
        :fieldKey="key"
        :fieldOptions="fieldOptions"
    ></object-property>
</div>
        `
    })

    Vue.component("object-property", {
        props: {
            editorGlobalStuff: Object,
            thing: Object,
            fieldKey: String,
            fieldOptions: Object
        },
        data,
        computed: {
            propertyExists,
            rawValue: {
                get: getRawValue,
                set: setRawValue
            },
            title,
            value: {
                get: getValue,
                set: setValue
            },
            inputType,
            isReadonly
        },
        methods: {
            launchFileBrowser
        },
        template: `
<label>
    {{ title }}
    <input
        v-if="inputType === 'string'"
        v-model="value"
        :readonly="isReadonly"
        class="block"
    />
    <textarea
        v-if="inputType === 'textarea'"
        v-model="value"
        :readonly="isReadonly"
        class="block"
    />
    <input
        v-if="inputType === 'number'"
        type="number"
        v-model.number="value"
        :readonly="isReadonly"
        class="block"
    />
    <input
        v-if="inputType === 'file'"
        :value="value"
        @dblclick.left="launchFileBrowser"
        :readonly="true"
        class="block pointer"
    />
</label>
        `
    })
}