export type Builder = {
  name: string
  run: () => PromiseLike<unknown>
  printErrors: boolean
  watchList: readonly string[]
}
