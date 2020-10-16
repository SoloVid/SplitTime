namespace splitTime.editor.level {
    interface VueObjectProperties {
        // props
        title: string,
        thing: { [key: string]: string | number }
        fields: { [key: string]: FieldOptions }
    }

    interface VueObjectProperty {
        // props
        thing: { [key: string]: unknown }
        fieldKey: string
        fieldOptions: FieldOptions
        // computed
        propertyExists: boolean
        rawValue: string | number
        title: string
        value: unknown
        inputType: "string" | "textarea" | "number"
        isReadonly: boolean
    }

    function propertyExists(this: VueObjectProperty): boolean {
        return this.fieldKey in this.thing
    }

    function getRawValue(this: VueObjectProperty): string | number {
        if (!this.propertyExists) {
            throw new Error("Can't access raw value when it doesn't exist!")
        }
        const value = this.thing[this.fieldKey]
        if (typeof value !== "number" && typeof value !== "string") {
            throw new Error("Value isn't a string or number")
        }
        return value
    }

    function setRawValue(this: VueObjectProperty, newValue: unknown): void {
        if (!this.propertyExists) {
            throw new Error("Can't access raw value when it doesn't exist!")
        }
        const oldValue = this.rawValue
        if (typeof newValue !== typeof oldValue) {
            throw new Error("Can't set value to different type")
        }
        this.thing[this.fieldKey] = newValue
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

    function inputType(this: VueObjectProperty): "string" | "textarea" | "number" {
        if (typeof this.rawValue === "number") {
            return "number"
        }
        if (typeof this.rawValue === "string") {
            const TEXTAREA_THRESHOLD = 32
            if (this.rawValue.length > TEXTAREA_THRESHOLD) {
                return "textarea"
            }
            return "string"
        }
        throw new Error("Property is not a number or string")
    }

    function isReadonly(this: VueObjectProperty): boolean {
        return !!this.fieldOptions.readonly
    }

    Vue.component("object-properties", {
        props: {
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
    <h3>{{ title }}</h3>
    <template v-for="(fieldOptions, key) in fields">
        <object-property :thing="thing" :fieldKey="key" :fieldOptions="fieldOptions"></object-property>
    </template>
</div>
        `
    })

    Vue.component("object-property", {
        props: {
            thing: Object,
            fieldKey: String,
            fieldOptions: Object
        },
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
        template: `
<label>
    {{ title }}
    <input
        v-if="inputType === 'string'"
        v-model="value"
        :readonly="isReadonly"
    />
    <textarea
        v-if="inputType === 'textarea'"
        v-model="value"
        :readonly="isReadonly"
    />
    <input
        v-if="inputType === 'number'"
        type="number"
        v-model.number="value"
        :readonly="isReadonly"
    />
</label>
        `
    })
}