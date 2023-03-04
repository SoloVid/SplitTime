import { debug, error } from "api/system"
import { EditorTsApi } from "editor/server/api/editor-ts-api"

export async function exerciseApi() {
  const api = new EditorTsApi()
  try {
    const test1Response = await api.test1.fetch("yo")
    if (test1Response !== "Here: yo") {
      error(`Unexpected response to test "yo": ${test1Response}`)
    }
    const test2Response = await api.test2.fetch(0)
    if (test2Response.one !== 1 || test2Response.two !== 2) {
      error(`Unexpected response to test 0:`, test2Response)
    }
  } catch (e) {
    error("Error hitting API")
    error(e)
  }
}
