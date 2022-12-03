import { useEffect, useState } from "preact/hooks";
import { EditorPropEntity } from "../level/extended-level-format";
import { getByPath } from "./immutable-helper";

type SubKeyPaths<T, Key extends (keyof T)> = Key extends string ? (readonly [Key] | readonly [Key, ...KeyPaths<T[Key]>]) : never
type KeyPaths<T> = T extends Record<string, unknown>
  ? (SubKeyPaths<T, keyof T>)
  : never

type A = KeyPaths<EditorPropEntity>

export function useArrayMemo<Input, Output, KeyField extends (keyof Input) | KeyPaths<Input> | null>(
  inputArray: readonly Input[],
  keyField: KeyField,
  map: (input: Input, index: number) => Output,
  dependencies: readonly unknown[]
): readonly Output[] {
  type KeyType = KeyField extends keyof Input
    ? Input[KeyField]
    : number
  type State = {
    mappings: Map<KeyType, readonly [Input, Output]>,
    outputArray: readonly Output[],
  }

  function getKey(input: Input, index: number): KeyType {
    if (keyField === null) {
      return index as KeyType
    }
    if (typeof keyField === "string") {
      return input[keyField as keyof Input] as KeyType
    }
    // TODO: More type safety?
    return getByPath(input as object, keyField as any) as KeyType
  }

  function updateState(before: State, forceUpdate: boolean = false): State {
    function calculate(input: Input, i: number) {
      const key = getKey(input, i)
      const [previousInput, previousOutput] = before.mappings.get(key) ?? [null, null]
      if (!forceUpdate && previousInput === input) {
        return [key, previousOutput as Output] as const
      }
      const newOutput = map(input, i)
      const mapping = [input, newOutput] as const
      mappingsAsMap.set(key, mapping)
      return [key, newOutput] as const
    }
    const mappingsAsMap = new Map<KeyType, readonly [Input, Output]>()
    const mappedArray: Output[] = []
    inputArray.forEach((input, i) => {
      const [key, output] = calculate(input, i)
      mappingsAsMap.set(key, [input, output])
      mappedArray.push(output)
    })
    return {
      mappings: mappingsAsMap,
      outputArray: mappedArray,
    }
  }

  // I think this is going to construct it once more than necessary.
  // const [state, setState] = useState<State>(updateState({
  //   mappings: new Map(),
  //   outputArray: [],
  // }))
  const [state, setState] = useState<State>(() => {
    return {
      mappings: new Map(),
      outputArray: [],
    }
  })

  useEffect(() => {
    setState(updateState)
  }, [inputArray])

  useEffect(() => {
    setState((before) => updateState(before, true))
  }, dependencies)

  return state.outputArray
}
