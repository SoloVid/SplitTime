import { assert } from "globals"
import { type HTMLAttributes } from "preact/compat"

type InputProps<T, ElementType extends HTMLElement = HTMLInputElement> = {
  readonly value: T
  readonly onChange: (newValue: T) => void
} & Omit<HTMLAttributes<ElementType>, "onChange" | "type" | "value" | "checked">

export function StringInput(props: InputProps<string>) {
  const { value, onChange, ...otherProps } = props

  return <input
    value={value}
    onInput={(e) => {
      const target = e.target
      assert(target !== null, "input target should be defined")
      const newValue = (target as unknown as Record<string, unknown>).value as string
      onChange(newValue)
    }}
    {...otherProps}
  />
}

export function MultilineStringInput(props: InputProps<string, HTMLTextAreaElement>) {
  const { value, onChange, ...otherProps } = props

  return <textarea
    onInput={(e) => {
      const target = e.target
      assert(target !== null, "input target should be defined")
      const newValue = (target as unknown as Record<string, unknown>).value as string
      onChange(newValue)
    }}
    {...otherProps}
  >{value}</textarea>
}

export function NumberInput(props: InputProps<number>) {
  const { value, onChange, ...otherProps } = props

  return <input
    type="number"
    value={value}
    onInput={(e) => {
      const target = e.target
      assert(target !== null, "input target should be defined")
      const newValue = (target as unknown as Record<string, unknown>).value as string | number
      onChange(+newValue)
    }}
    {...otherProps}
  />
}

export function CheckboxInput(props: InputProps<boolean>) {
  const { value, onChange, ...otherProps } = props

  return <input
    type="checkbox"
    checked={value}
    onChange={(e) => {
      const target = e.target
      assert(target !== null, "input target should be defined")
      const newValue = (target as unknown as Record<string, unknown>).checked as boolean
      onChange(newValue)
    }}
    {...otherProps}
  />
}

type SelectProps<T extends string | number> = {
  readonly value: T
  readonly onChange: (newValue: T) => void
  readonly options: readonly (readonly [value: T, display: string])[]
} & Omit<HTMLAttributes<HTMLSelectElement>, "onChange" | "value">

export function SelectInput<T extends string | number>(props: SelectProps<T>) {
  return <select value={props.value} onChange={(e) => {
    const target = e.target
    assert(target !== null, "select target should be defined")
    const newValue = (target as unknown as Record<string, unknown>).value as T
    props.onChange(newValue)
  }}>
    {props.options.map(([value, display]) => (
      <option value={value}>{display}</option>
    ))}
  </select>
}
