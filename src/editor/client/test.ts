import { debug } from "api/system"
import { EditorTsApi } from "editor/server/api/editor-ts-api"

export async function exerciseApi() {
  const api = new EditorTsApi()
  const test1Response = await api.test1.fetch("himom (from client)")
  debug(test1Response)
  const test2Response = await api.test2.fetch(3)
  debug(test2Response)
}
