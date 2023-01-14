import { FileEntry } from "editor/server/api/project-file-ts-api"
import { formatBytes } from "engine/utils/misc"
import { useEffect, useState } from "preact/hooks"
import { StringInput } from "./input"
import { makeClassNames } from "./preact-help"
import { ServerLiaison } from "./server-liaison"

type FileBrowserProps = {
  readonly confirmActionText: string
  readonly initialDirectory: string
  readonly initialFileName: string
  readonly onFileSelected: (file: string) => void
  readonly rootDirectory: string
  readonly server: ServerLiaison
  readonly showTextBox: boolean
  readonly title: string
}

export default function FileBrowser(props: FileBrowserProps) {
  const {
    confirmActionText,
    initialDirectory,
    initialFileName,
    onFileSelected,
    rootDirectory,
    server,
    showTextBox,
    title,
  } = props
  const rootDirectoryParts = rootDirectory.split("/").filter(p => p !== "")
  const normalizedRootDirectory = rootDirectoryParts.map(p => "/" + p).join("")
  let hitRoot = false
  const initialDirectoryParts = initialDirectory.split("/").filter(p => p !== "")
  const normalizedInitialDirectory = initialDirectoryParts.map(p => "/" + p).join("")
  let soFar = ""
  let initialStack: string[] = []
  for (const part of initialDirectoryParts) {
    if (!hitRoot) {
      if (soFar === normalizedRootDirectory) {
        hitRoot = true
      }
    }
    if (hitRoot) {
      initialStack.push(soFar)
    }
    soFar = soFar + "/" + part
  }

  const [currentDirectory, setCurrentDirectory] = useState(normalizedInitialDirectory || normalizedRootDirectory || "")

  const [filesInDirectory, setFilesInDirectory] = useState<readonly FileEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stack, setStack] = useState<readonly string[]>(initialStack)
  const [selectedFileName, setSelectedFileName] = useState(initialFileName || "")

  function projectDirectory(): string {
    return server.projectId
  }

  function backDirectory(e: MouseEvent): void {
    if (e.button !== 0) {
      return
    }
    if (stack.length === 0) {
      throw new Error("Stack is empty")
    }
    const newStack = [...stack]
    const backTo = newStack.pop() as string
    changeDirectory(backTo, true)
    setStack(newStack)
    e.preventDefault()
  }

  async function changeDirectory(directoryFullPath: string, skipPushStack: boolean = false): Promise<void> {
    setSelectedFileName("")
    setIsLoading(true)
    const s = server
    const requestData = s.withProject({ directory: directoryFullPath })
    try {
      const filesFromServer = await s.api.projectFiles.directoryListing.fetch(requestData)
      filesFromServer.sort((a, b) => {
        if (a.type === "directory" && b.type === "file") {
          return -1
        }
        if (a.type === "file" && b.type === "directory") {
          return 1
        }
        return a.name.localeCompare(b.name)
      })
      if (!skipPushStack) {
        setStack([...stack, currentDirectory])
      }
      setFilesInDirectory(filesFromServer)
      setCurrentDirectory(directoryFullPath)
    } finally {
      setIsLoading(false)
    }
  }

  function isDirectory(fileName: string): boolean {
    const matchingFiles = filesInDirectory.filter(f => f.name === fileName)
    if (matchingFiles.length === 0) {
      return false
    }
    const fileInfo = matchingFiles[0]
    return fileInfo.type === "directory"
  }

  function onClickConfirm(): void {
    selectFile(selectedFileName)
  }

  // Per https://stackoverflow.com/a/43321596/4639640
  function onMouseDown(event: MouseEvent): void {
    // On double+ click
    if (event.detail > 1) {
      // We're trying to prevent double-click highlight
      event.preventDefault();
    }
  }

  function selectFile(fileName: string): void {
    if (!fileName) {
      onFileSelected("")
      return
    }

    const fileFullPath = currentDirectory + "/" + fileName
    if (isDirectory(fileName)) {
      changeDirectory(fileFullPath)
    } else {
      onFileSelected(fileFullPath)
    }
  }

  useEffect(() => {
    changeDirectory(currentDirectory, true)
    // Reset this because changeDirectory() clears it
    setSelectedFileName(initialFileName)
  }, [])

  function formatDate(ms: number) {
    const d = new Date(ms)
    return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes()
  }

  return <div>
  <h4>{ title }</h4>
  <div style="border: 1px solid black; padding: 4px; margin-bottom: 5px;">
    <em>{ projectDirectory() }<strong>{ currentDirectory || "/" }</strong></em>
  </div>
  <table className="row-simple">
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Date modified</th>
        <th style="text-align: right">Size</th>
      </tr>
    </thead>
    <tbody>
      {stack.length > 0 && <tr
        onDblClick={backDirectory}
        onMouseDown={onMouseDown}
        className="pointer"
      >
        <td>
          <i className="fas fa-fw fa-backward"></i>
        </td>
        <td><em>Back</em></td>
        <td></td>
        <td></td>
      </tr>}
      {filesInDirectory.map((file) => (
      <tr
        onClick={(e) => { if (e.button === 0) setSelectedFileName(file.name) }}
        onDblClick={(e) => { if (e.button === 0) selectFile(file.name); e.preventDefault() }}
        onMouseDown={onMouseDown}
        className={makeClassNames({ pointer: true, active: file.name === selectedFileName })}
      >
        <td>
          {file.type === 'file' && <i className="fas fa-fw fa-file"></i>}
          {file.type === 'directory' && <i className="fas fa-fw fa-folder"></i>}
        </td>
        <td>{ file.name }</td>
        <td>{ formatDate(file.timeModified) }</td>
        <td style="text-align: right">
          {file.type !== 'directory' && <span>
            { formatBytes(file.size) }
          </span>}
        </td>
      </tr>
      ))}
    </tbody>
  </table>
  <br/>
  {showTextBox && <div style="display: flex; gap: 0.5rem;">
    <div>File&nbsp;Name:</div>
    <div style="flex-grow: 1">
      <StringInput value={selectedFileName} onChange={setSelectedFileName} className="block"/>
    </div>
  </div>}
  <br/>
  <div className="right">
    {selectedFileName !== '' && <a className="btn" onClick={onClickConfirm}>{ confirmActionText }</a>}
    <a className="btn" onClick={() => selectFile('')}>Cancel</a>
  </div>
  </div>
}