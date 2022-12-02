import { useEffect, useState } from "preact/hooks";

export function useArrayMemo<Input, Output, KeyField extends (keyof Input) | null>(
  inputArray: readonly Input[],
  keyField: KeyField,
  map: (input: Input, index: number) => Output,
  dependencies: readonly unknown[]
): readonly Output[] {
  type KeyType = KeyField extends keyof Input
    ? Input[KeyField]
    : number
  type State = {
    mappings: Map<KeyType, [Input, Output]>,
    outputArray: readonly Output[],
  }

  function updateState(before: State): State {
    const mappedArray = inputArray.map((input, i) => {
      const key = (keyField !== null ? input[keyField] : i) as KeyType
      const [previousInput, previousOutput] = before.mappings.get(key) ?? [null, null]
      if (previousInput === input) {
        return [input, previousOutput as Output] as const
      }
      const newOutput = map(input, i)
      return [input, newOutput] as const
    })
    const mappingsAsMap = new Map()
    for (const [input, output] of mappedArray) {
      mappingsAsMap.set(input, output)
    }
    return {
      mappings: mappingsAsMap,
      outputArray: mappedArray.map(([,output]) => output),
    }
  }

  // I think this is going to construct it once more than necessary.
  // const [state, setState] = useState<State>(updateState({
  //   mappings: new Map(),
  //   outputArray: [],
  // }))
  const [state, setState] = useState<State>({
    mappings: new Map(),
    outputArray: [],
  })

  useEffect(() => {
    setState(updateState)
  }, [inputArray, ...dependencies])

  return state.outputArray
}
