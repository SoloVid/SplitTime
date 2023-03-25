import Dropzone from "dropzone"
import { FileEntry } from "editor/server/api/project-file-ts-api"
import { uploadEndpoint } from "editor/server/constants"
import { formatBytes } from "engine/utils/misc"
import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import swal from "sweetalert"
import { newCollage } from "./collage/new-collage"
import { StringInput } from "./input"
import { newLevel } from "./level/new-level"
import Modal from "./modal"
import { makeClassNames, onlyLeft } from "./preact-help"
import { ServerLiaison } from "./server-liaison"
import { prompt, warningConfirmation } from "./utils/prompt"

Dropzone.autoDiscover = false

type FileBrowserProps = {
  readonly confirmActionText: string
  readonly initialDirectory: string
  readonly initialFileName: string
  readonly onFileSelected: (file: string) => void
  readonly rootDirectory: string
  readonly server: ServerLiaison
  readonly filter?: RegExp
  readonly showNew?: boolean
  readonly showUpload?: boolean
  readonly hideCancel?: boolean
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
    filter,
    showNew,
    showUpload,
    hideCancel,
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

  const [showUploadBox, setShowUploadBox] = useState(false)
  const uploadFormRef = useCallback((node: HTMLFormElement | null) => {
    if (node === null) {
      return
    }
    const options: Dropzone.DropzoneOptions = {
      headers: {
        "X-Directory-Path": JSON.stringify(currentDirectory),
        "X-Project-Id": JSON.stringify(server.projectId),
      }
    }
    const dz = new Dropzone(node, options)
    dz.on("success", file => {
      refreshDirectory()
      // console.log(`File added: ${file.name}`)
    })
  }, [currentDirectory, server.projectId])

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

  async function confirmOverwriteFile(fileName: string) {
    if (filesInDirectory.some(f => f.name === fileName)) {
      return await warningConfirmation(`${fileName} already exists. Are you sure you want to overwrite it?`, "Overwrite File?")
    }
    return null
  }

  async function newFile() {
    const newFileType = await swal({
      title: "New File",
      text: "What type of file do you want to create?",
      buttons: {
        text: true,
        level: true,
        collage: true,
        cancel: true,
      }
    })
    const newFileContents = (() => {
      if (newFileType === "text") {
        return ""
      }
      if (newFileType === "level") {
        return JSON.stringify(newLevel, null, 2)
      }
      if (newFileType === "collage") {
        return JSON.stringify(newCollage, null, 2)
      }
      return null
    })()

    if (newFileContents === null) {
      return
    }

    const newFileName = await prompt("New File Name?")
    if (newFileName === null) {
      return
    }
    const confirm = await confirmOverwriteFile(newFileName)
    if (confirm === false) {
      return
    }
    await server.api.projectFiles.writeFile.fetch(server.withProject({
      filePath: `${currentDirectory}/${newFileName}`,
      base64Contents: btoa(newFileContents),
      allowOverwrite: confirm === true,
    }))
    await refreshDirectory()
  }

  async function renameFile(fileName: string) {
    const newFileName = await prompt("New File Name?")
    if (newFileName === null) {
      return
    }
    const confirm = await confirmOverwriteFile(newFileName)
    if (confirm === false) {
      return
    }
    await server.api.projectFiles.moveFile.fetch(server.withProject({
      oldFilePath: `${currentDirectory}/${fileName}`,
      newFilePath: `${currentDirectory}/${newFileName}`,
      allowOverwrite: confirm === true,
    }))
    await refreshDirectory()
  }

  async function deleteFile(fileName: string) {
    const filePath = `${currentDirectory}/${fileName}`
    const confirmed = await warningConfirmation(`Are you sure you want to delete ${filePath}?`, "Delete File?")
    if (!confirmed) {
      return
    }
    await server.api.projectFiles.deleteFile.fetch(server.withProject({
      filePath: filePath,
    }))
    await refreshDirectory()
  }

  async function refreshDirectory() {
    await changeDirectory(currentDirectory, true)
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
    return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + ("" + d.getHours()).padStart(2, "0") + ":" + ("" + d.getMinutes()).padStart(2, "0")
  }

  function getFileIcon(file: string) {
    if (/\.lvl\.yml$/.test(file)) {
      return "fa-map-marked-alt"
    }
    if (/\.clg\.yml$/.test(file)) {
      return "fa-images"
    }
    return "fa-file"
  }

  function shouldShowFile(entry: FileEntry) {
    if (entry.type === "directory") {
      return true
    }
    const full = entry.parentPath + entry.name
    if (!filter || filter.test(full)) {
      return true
    }
    return false
  }

  return <div className="file-browser">
    {showUploadBox && <Modal close={() => setShowUploadBox(false)}>
        <form ref={uploadFormRef} action={uploadEndpoint} method="post" encType="multipart/form-data" class="dropzone"></form>
    </Modal>}
    <div className="tool-bar" style="display: flex; flex-direction: row; align-items: baseline; justify-content: space-between;">
      <h4>{ title }</h4>
      <div>
        {showUpload && <a onClick={onlyLeft(() => setShowUploadBox(true), true)} title="Upload" aria-label="Upload file to this directory">
          <i className="fas fa-fw fa-upload pointer" aria-hidden="true"></i>
        </a>}
        <a onClick={onlyLeft(refreshDirectory, true)} title="Refresh" aria-label="Refresh file list">
          <i className="fas fa-fw fa-sync pointer" aria-hidden="true"></i>
        </a>
      </div>
    </div>
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
        <th></th>
        <th></th>
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
        <td></td>
        <td></td>
      </tr>}
      {filesInDirectory.filter(shouldShowFile).map((file) => (
      <tr
        onClick={(e) => { if (e.button === 0) setSelectedFileName(file.name) }}
        onDblClick={(e) => { if (e.button === 0) selectFile(file.name); e.preventDefault() }}
        onMouseDown={onMouseDown}
        className={makeClassNames({ pointer: true, active: file.name === selectedFileName })}
      >
        <td>
          {file.type === 'file' && <i className={`fas fa-fw ${getFileIcon(file.name)}`} aria-hidden="true" title="file"></i>}
          {file.type === 'directory' && <i className="fas fa-fw fa-folder" aria-hidden="true" title="directory"></i>}
        </td>
        <td>{ file.name }</td>
        <td>{ formatDate(file.timeModified) }</td>
        <td style="text-align: right">
          {file.type !== 'directory' && <span>
            { formatBytes(file.size) }
          </span>}
        </td>
        <td style="padding: 0; width: 24px;">
          <a onClick={() => renameFile(file.name)} title="Rename" aria-label="Rename file">
            <i className="fas fa-fw fa-magic pointer" aria-hidden="true"></i>
          </a>
        </td>
        <td style="padding: 0; width: 24px;">
          <a onClick={() => deleteFile(file.name)} title="Delete" aria-label="Delete file">
            <i className="fas fa-fw fa-trash pointer" aria-hidden="true"></i>
          </a>
        </td>
      </tr>
      ))}
      {showNew && <tr
        onDblClick={onlyLeft(newFile, true)}
        onMouseDown={onMouseDown}
        className="pointer"
      >
        <td>
          <i className="fas fa-fw fa-plus"></i>
        </td>
        <td><em>New...</em></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>}
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
    {!hideCancel && <a className="btn" onClick={() => selectFile('')}>Cancel</a>}
  </div>
  </div>
}