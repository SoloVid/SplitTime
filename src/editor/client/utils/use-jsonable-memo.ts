import { Inputs, useMemo } from "preact/hooks";

export function useJsonableMemo<T>(factory: () => T, inputs: Inputs | undefined): T {
  const calculatedValue = useMemo(factory, inputs)
  const checkValue = useMemo(() => JSON.stringify(calculatedValue), [calculatedValue])
  const optimizedValue = useMemo(() => calculatedValue, [checkValue])
  return optimizedValue
}
