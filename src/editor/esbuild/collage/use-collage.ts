import { useEffect, useState } from "preact/hooks"
import { FileCollage } from "../file-types"
import { ServerLiaison } from "../server-liaison"

export function useCollageJson(s: ServerLiaison, collageId: string | null) {
  const [collageJson, setCollageJson] = useState<FileCollage | null>(null)
  useEffect(() => {
    if (collageId === null) {
      return
    }
    s.api.collageJson.fetch(s.withProject({ collageId })).then(setCollageJson)
  }, [collageId])
  return [collageJson]
}
