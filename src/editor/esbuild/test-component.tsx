import { generateUID } from "engine/utils/misc"
import { createContext } from "preact"
import { useContext, useEffect, useMemo, useState } from "preact/hooks"

const B = createContext(false)

export default function TestComponent() {

  const [b, setB] = useState<boolean>(false)
  const [arr, setArr] = useState<unknown[]>([])
  const [obj, setObj] = useState<Record<string, unknown>>({})

  console.log("rendering TestComponent", arr, obj)

  useEffect(() => {
    console.log("arr effect")
  }, [arr])

  useEffect(() => {
    console.log("obj effect")
  }, [obj])

  const arr2 = useMemo(() => {
    console.log("arr memo")
    return [...arr]
  }, [arr])
  const obj2 = useMemo(() => {
    console.log("obj memo")
    return {...obj}
  }, [obj])

  return <div>
    test component
    <div>arr: {JSON.stringify(arr)}</div>
    <div>arr2: {JSON.stringify(arr2)}</div>
    <div>obj: {JSON.stringify(obj)}</div>
    <div>obj2: {JSON.stringify(obj2)}</div>
    <div>b: {JSON.stringify(b)}</div>
    <div onClick={() => arr.push(1)}>push to array</div>
    <div onClick={() => arr[0] = 5}>set [0]</div>
    <div onClick={() => setArr([...arr, 2])}>replace array</div>
    <div onClick={() => obj[generateUID()] = 3}>add to object</div>
    <div onClick={() => obj["himom"] = "yo"}>set ["himom"]</div>
    <div onClick={() => setObj({...obj, [generateUID()]: 4})}>replace object</div>
    <div onClick={() => setB(true)}>set true ({JSON.stringify(b)})</div>
    <div onClick={() => setB(before => !before)}>set true ({JSON.stringify(b)})</div>
    <B.Provider value={b}>
      <IntramediateComponent />
    </B.Provider>
  </div>
}

function IntramediateComponent() {
  console.log("rendering IntramediateComponent")

  return <IntramediateComponent2 />
}

function IntramediateComponent2() {
  console.log("rendering IntramediateComponent2")

  return <LeafComponent />
}

function LeafComponent() {
  console.log("rendering LeafComponent")

  const b = useContext(B)
  return <div>
    {b}
  </div>
}
