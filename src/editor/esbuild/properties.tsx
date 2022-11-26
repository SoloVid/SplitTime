import { useMemo, useState } from "preact/hooks"
import { FieldOptions, GenericObjectProperties, ObjectProperties } from "./field-options"
import { MultilineStringInput, NumberInput, StringInput } from "./input"
import { GlobalEditorShared } from "./shared-types"
import { getByPath, updateImmutableObject } from "./utils/immutable-helper"

type PropertiesPanelProps = {
  readonly editorGlobalStuff: SinglePropertyProps["editorGlobalStuff"]
  readonly spec: GenericObjectProperties
}

export default function PropertiesPane(props: PropertiesPanelProps) {
  const { editorGlobalStuff, spec } = props
  function updateField(fieldKey: string, newValue: string | number, oldValue: string | number) {
    updateImmutableObject(
      spec.topLevelThing,
      spec.setTopLevelThing,
      [...spec.pathToImportantThing, fieldKey],
      // TODO: More type safety?
      newValue as any
    )
    spec.onUpdate(fieldKey, newValue, oldValue)
  }

  function doDelete(): void {
    if (!spec.allowDelete) {
      return
    }
    if (!window.confirm("Are you sure you want to delete this?")) {
      return
    }
    updateImmutableObject(spec.topLevelThing, spec.setTopLevelThing, spec.pathToImportantThing, undefined)
    spec.onDelete()
  }

  // TODO: More type safety?
  const thing = getByPath(spec.topLevelThing, spec.pathToImportantThing) as object
  const listForRender = Object.entries(spec.fields)
    .filter(([key]) => key in thing)
    .map(([key, fieldOptions]) => ({
      key,
      fieldOptions,
      // TODO: More type safety?
      value: getByPath(spec.topLevelThing, [...spec.pathToImportantThing, key]) as string | number,
    }))

  return <div class="object-properties">
    <div><strong>{ spec.title }</strong></div>
    {listForRender.map((p) => (
    <SingleProperty
      key={spec.title + p.key}
      editorGlobalStuff={editorGlobalStuff}
      value={p.value}
      fieldKey={p.key}
      fieldOptions={p.fieldOptions}
      setField={(newValue) => updateField(p.key, newValue, p.value)}
    />
    ))}
    {/* <a v-if="!!spec.doDelete" class="btn" @click="doDelete">Delete</a> */}
  </div>
}

type SinglePropertyProps = {
  readonly editorGlobalStuff: Pick<GlobalEditorShared, "createUndoPoint" | "openFileSelect">
  readonly value: string | number
  readonly fieldKey: string
  readonly fieldOptions: FieldOptions
  readonly setField: (newValue: string | number) => void
}

function SingleProperty(props: SinglePropertyProps) {
  const {
    editorGlobalStuff,
    value,
    fieldKey,
    fieldOptions,
    setField,
  } = props

  const [isTempEmpty, setIsTempEmpty] = useState(false)

  // function propertyExists(): boolean {
  //   return fieldKey in thing
  // }

  const rawValue = useMemo(() => {
    // if (!propertyExists) {
    //   throw new Error("Can't access raw value (" + fieldKey + ") when it doesn't exist!")
    // }
    // if (this.isTempEmpty) {
    //   return ""
    // }
    // const value = thing[fieldKey]
    if (typeof value !== "number" && typeof value !== "string") {
      throw new Error("Value (" + fieldKey + ") isn't a string or number")
    }
    return value
  }, [fieldKey, value, isTempEmpty])

  function setRawValue(newValue: string | number): void {
    // if (!propertyExists) {
    //   throw new Error("Can't access raw value (" + fieldKey + ") when it doesn't exist!")
    // }
    const oldValue = rawValue
    if (typeof newValue !== typeof oldValue) {
      if (typeof oldValue === "number" && !newValue) {
        setIsTempEmpty(true)
        return
      }
      throw new Error("Can't set value (" + fieldKey + ") to different type")
    }
    setField(newValue)
    setIsTempEmpty(false)
  }

  function title(): string {
    return fieldOptions.title || fieldKey
  }

  function setValue(value: unknown): void {
    if (typeof value === "number" || typeof value === "string") {
      setRawValue(value)
    }
  }

  const inputType = useMemo(() => {
    if (typeof rawValue === "number") {
      return "number"
    }
    if (typeof rawValue === "string") {
      if (fieldOptions.isFile) {
        return "file"
      }
      const TEXTAREA_THRESHOLD = 32
      if (rawValue.length > TEXTAREA_THRESHOLD) {
        return "textarea"
      }
      return "string"
    }
    throw new Error("Property (" + fieldKey + ") is not a number or string")
  }, [rawValue, fieldOptions, fieldKey])

  async function launchFileBrowser(): Promise<void> {
    const root = fieldOptions.fileBrowserRoot || ""
    const filePath = await editorGlobalStuff.openFileSelect(root)
    const prefixRegex = new RegExp("^/?" + root + "/?")
    setValue(filePath.replace(prefixRegex, ""))
  }

  function onChange(): void {
    editorGlobalStuff.createUndoPoint()
  }

  function isReadonly(): boolean {
    return !!fieldOptions.readonly
  }

  return <label className={`object-property field-key-${fieldKey}`}>
    { title }
    {inputType === 'string' && <StringInput
      value={rawValue as string}
      onChange={(v) => { setValue(v); onChange() }}
      readonly={isReadonly()}
      className="block"
    />}
    {inputType === 'textarea' && <MultilineStringInput
      value={rawValue as string}
      onChange={(v) => { setValue(v); onChange() }}
      readonly={isReadonly()}
      className="block"
    />}
    {inputType === 'number' && <NumberInput
      value={rawValue as number}
      onChange={(v) => { setValue(v); onChange() }}
      readonly={isReadonly()}
      className="block"
    />}
    {inputType === 'file' && <input
      value={rawValue as string}
      onDblClick={(e) => { if (e.button === 0) launchFileBrowser() }}
      onChange={onChange}
      readonly={true}
      className="block pointer"
    />}
  </label>
}