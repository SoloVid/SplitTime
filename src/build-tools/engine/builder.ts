export type Builder = {
  name: string
  run: () => PromiseLike<unknown>
  close?: () => PromiseLike<unknown>
  printErrors: boolean
  watchList: readonly string[]
}
