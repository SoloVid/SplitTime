import { assert } from "globals"
import { type HTMLAttributes } from "preact/compat"

type InputProps<T> = {
  readonly value: T
  readonly onChange: (newValue: T) => void
} & Omit<HTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value" | "checked">

export function StringInput(props: InputProps<string>) {
  const { value, onChange, ...otherProps } = props

  return <input
    value={value}
    onChange={(e) => {
      const target = e.target
      assert(target !== null, "input target should be defined")
      const newValue = (target as unknown as Record<string, unknown>).value as string
      onChange(newValue)
    }}
    {...otherProps}
  />
}

export function NumberInput(props: InputProps<number>) {
  const { value, onChange, ...otherProps } = props

  return <input
    type="number"
    value={value}
    onChange={(e) => {
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
