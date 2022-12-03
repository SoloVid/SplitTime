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
      // console.log("key", key)
      // console.log(input, i)
      // const key = (keyField !== null ? input[keyField] : i) as KeyType
      const [previousInput, previousOutput] = before.mappings.get(key) ?? [null, null]
      if (!forceUpdate && previousInput === input) {
        if (previousOutput === null) {
          console.error("stale null!")
        }
        return [key, previousOutput as Output] as const
      }
      console.log("not equal")
      const newOutput = map(input, i)
      if (newOutput === null) {
        console.error("fresh null!")
      }
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
    console.log("outputArray", mappedArray)
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
    console.log("resetting array state")
    return {
      mappings: new Map(),
      outputArray: [],
    }
  })

  // useEffect(() => {
  //   console.log("dependencies updated", state)
  // }, dependencies)

  // useEffect(() => {
  //   console.log("inputArray updated", state)
  // }, [inputArray])

  useEffect(() => {
    console.log("updating state with inputArray", inputArray)
    setState(updateState)
  }, [inputArray])

  useEffect(() => {
    console.log("updating state with dependencies", inputArray)
    setState((before) => updateState(before, true))
  }, dependencies)

  return state.outputArray
}
