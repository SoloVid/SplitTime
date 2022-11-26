export interface FieldOptions {
  readonly?: boolean
  title?: string
  isFile?: boolean
  fileBrowserRoot?: string
}

export interface ObjectProperties {
  title: string,
  thing: { [key: string]: string | number }
  fields: { [key: string]: FieldOptions }
  doDelete: (() => void) | null
}
