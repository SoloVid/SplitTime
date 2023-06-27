import { useEffect, useState } from "preact/hooks";
import { getByPath } from "./immutable-helper";
import { getFingerprint } from "./fingerprint";
import fastDeepEqual from "fast-deep-equal/es6"

type SubKeyPaths<T, Key extends (keyof T)> = Key extends string ? (readonly [Key] | readonly [Key, ...KeyPaths<T[Key]>]) : never
type KeyPaths<T> = T extends Record<string, unknown>
  ? (SubKeyPaths<T, keyof T>)
  : never

type Options = {
  useDeepCompare?: boolean
}

export function useArrayMemo<Input, Output, KeyField extends (keyof Input) | KeyPaths<Input> | null>(
  inputArray: readonly Input[],
  keyField: KeyField,
  map: (input: Input, index: number) => Output,
  dependencies: readonly unknown[],
  options: Options = {},
): readonly Output[] {
  type KeyType = KeyField extends keyof Input
    ? Input[KeyField]
    : number
  type State = {
    mappings: Map<KeyType, readonly [Input, Output, unknown]>,
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
      const [previousInput, previousOutput, previousInputStringified] = before.mappings.get(key) ?? [null, null, ""]
      if (!forceUpdate && (previousInput === input || (options.useDeepCompare && fastDeepEqual(previousInput, input) /*previousInputStringified === getFingerprint(input)*/))) {
        return [key, previousOutput as Output, previousInputStringified] as const
      }
      const newOutput = map(input, i)
      const newInputStringified = ""// options.useJsonCompare ? getFingerprint(input) : ""
      const mapping = [input, newOutput, newInputStringified] as const
      mappingsAsMap.set(key, mapping)
      return [key, newOutput, newInputStringified] as const
    }
    const mappingsAsMap = new Map<KeyType, readonly [Input, Output, unknown]>()
    const mappedArray: Output[] = []

    function doOne(input: Input, i: number) {
      const [key, output, previousInputStringified] = calculate(input, i)
      mappingsAsMap.set(key, [input, output, previousInputStringified])
      mappedArray.push(output)
    }

    inputArray.forEach(doOne)
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
