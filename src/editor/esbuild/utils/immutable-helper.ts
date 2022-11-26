import { Immutable } from "engine/utils/immutable";
import { assert } from "globals";
import { ImmutableSetter } from "../preact-help";

type DebugNever<Message extends string, ExtraData = never> = [never, Message, ExtraData]
type AssertExtends<T, Extends, Message extends String> = T extends Extends ? T : never

type Single<T, PathPart extends (string | number)> = PathPart extends string
  ? T extends Readonly<Record<PathPart, infer ValueType>>
    ? ValueType
    : DebugNever<"Object expected in T because PathPart was string", [T, PathPart]>
  : PathPart extends number
    ? T extends readonly (infer U)[]
      ? U
      : DebugNever<"Array expected in T because PathPart was number", [T, PathPart]>
    : DebugNever<"PathPart unexpected type", PathPart>

export type Drilled<T, Path extends readonly (string | number)[]> = Path extends [infer FirstPathPart, ...(infer OtherPathParts)]
  ? Drilled<
      Single<T, AssertExtends<FirstPathPart, string | number, "FirstPathPart should be a string or number">>,
      AssertExtends<OtherPathParts, readonly (string | number)[], "OtherPathParts should be array of string or number">
    >
  : T

export type BasePath = readonly (string | number)[]

export function getByPath<T extends object | readonly unknown[], Path extends BasePath>(obj: Immutable<T>, path: Path): unknown {
  if (path.length === 0) {
    return obj
  }
  const [firstPathPart, ...otherPathParts] = path
  if (typeof firstPathPart === "number") {
    assert(firstPathPart >= 0, "First path part is number but is negative")
    assert(Array.isArray(obj), "First path part is number, so array expected")
    assert(firstPathPart < obj.length, "First path part is number but is beyond array range")
    return getByPath(obj[firstPathPart], otherPathParts)
  }

  assert(typeof obj === "object", "First path part is string, so object expected")
  assert(obj !== null, "First path part is string but object is null")
  assert(firstPathPart in obj, "First path part is string but is not in object")
  return getByPath(
    // TODO: Make this type-case more specific.
    obj[firstPathPart as keyof typeof obj] as any,
    otherPathParts,
  )
}

export function updateImmutableObject<T extends object | readonly unknown[], Path extends readonly (string | number)[]>(obj: Immutable<T>, setter: ImmutableSetter<T>, path: Path, value: Drilled<T, Path> | undefined) {
  setter((before) => makeUpdatedObject(obj, path, value))
}

export function makeUpdatedObject<T extends unknown, Path extends readonly (string | number)[]>(obj: Immutable<T>, path: Path, value: Drilled<T, Path> | undefined): Immutable<T> {
  if (path.length === 0) {
    return value as Immutable<T>
  }
  const [firstPathPart, ...otherPathParts] = path
  if (typeof firstPathPart === "number") {
    assert(firstPathPart >= 0, "First path part is number but is negative")
    assert(Array.isArray(obj), "First path part is number, so array expected")
    assert(firstPathPart < obj.length, "First path part is number but is beyond array range")
    if (path.length === 1 && value === undefined) {
      return [
        ...obj.slice(0, firstPathPart),
        ...obj.slice(firstPathPart + 1)
      ] as Immutable<T>
      }
    return [
      ...obj.slice(0, firstPathPart),
      makeUpdatedObject(obj[firstPathPart], otherPathParts, value),
      ...obj.slice(firstPathPart + 1)
    ] as Immutable<T>
  }

  assert(typeof obj === "object", "First path part is string, so object expected")
  assert(obj !== null, "First path part is string but object is null")
  assert(firstPathPart in obj, "First path part is string but is not in object")
  if (path.length === 1 && value === undefined) {
    const copiedObj = { ...obj }
    delete copiedObj[firstPathPart as keyof typeof obj]
    return copiedObj
  }
  return {
    ...obj,
    [firstPathPart]: makeUpdatedObject(
      // TODO: Make this type-case more specific.
      obj[firstPathPart as keyof typeof obj] as any,
      otherPathParts,
      value
    )
  } as Immutable<T>
}
