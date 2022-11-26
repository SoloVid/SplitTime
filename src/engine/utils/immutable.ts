// From https://github.com/Microsoft/TypeScript/issues/13923#issuecomment-557509399
// and https://github.com/Microsoft/TypeScript/issues/13923#issuecomment-716706151

export type Immutable<T> =
  T extends ImmutablePrimitive ? T :
  T extends Map<infer K, infer V> ? ImmutableMap<K, V> :
  T extends Set<infer M> ? ImmutableSet<M> : ImmutableObject<T>; 

type ImmutablePrimitive = undefined | null | boolean | string | number | Function;
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };