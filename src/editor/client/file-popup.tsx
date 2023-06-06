import { createContext } from "preact";
import { useState } from "preact/hooks";
import { ImmutableSetter } from "./preact-help";
import FileBrowser from "./file-browser";
import { assert } from "globals";

type FileBrowserReturnListener = {f: (filePath: string) => void}

type FilePopupState = {
  show: boolean
  confirmActionText: string
  returnListener: null | FileBrowserReturnListener
  root: string
  showTextBox: boolean
  startDirectory: string
  startFileName: string
  title: string
  filter: undefined | RegExp
}

export function useFilePopupState() {
  return useState<FilePopupState>({
    show: false,
    confirmActionText: "Select",
    returnListener: null,
    root: "",
    showTextBox: false,
    startDirectory: "",
    startFileName: "",
    title: "Select File",
    filter: undefined,
  })
}

type FilePopupControls = {
  readonly showFileSelectPopup: (settings: Partial<Omit<FilePopupState, "show">>) => PromiseLike<string>
  // readonly openFileSave: () => void
  // readonly openFileSelect: (rootDirectory: string, filter?: RegExp) => PromiseLike<string>
}

export function useFilePopupControls(): FilePopupControls {
  const [state, setState] = useFilePopupState()
  return {
    async showFileSelectPopup(settings) {
      const returnedPath = await new Promise<string>((resolve) => {
        setState(before => ({
          ...before,
          returnListener: {f: newFilePath => resolve(newFilePath)},
          title: "Select File",
          confirmActionText: "Select",
          root: "",
          startDirectory: "",
          showTextBox: false,
          filter: undefined,
          ...settings,
          show: true,
        }))
      })
      return returnedPath
    },
  }
}

export const FilePopupContext = createContext<FilePopupControls>({
  showFileSelectPopup: async () => "",
  // openFileSave: async () => undefined,
  // openFileSelect: async () => "",
})

type Props = {
  state: FilePopupState
  setState: ImmutableSetter<FilePopupState>
  children: any
}

export function FilePopupContextProvider({state, setState, children}: Props) {
  function openFileSave(): void {
    const filter = level !== null ? /\.lvl\.yml$/ : (collage !== null ? /\.clg\.yml$/ : undefined)
    const lastSlash = filePath.lastIndexOf("/")
    const preloadDirectory = filePath.substring(0, lastSlash)
    const preloadFileName = filePath.substring(lastSlash + 1)
    setFileBrowserReturnListener({ f: async newFilePath => {
      doSave(newFilePath)
      setFilePath(newFilePath, editorType)
    } })
    setFileBrowserTitle("Save File As")
    setFileBrowserConfirmActionText("Save")
    setFileBrowserRoot("")
    setFileBrowserStartDirectory(preloadDirectory)
    setFileBrowserShowTextBox(true)
    setFileBrowserFilter(filter)
    setFileBrowserStartFileName(preloadFileName)
    setShowFileBrowser(true)
  }

  // function openFileSelect(rootDirectory: string, filter?: RegExp): PromiseLike<string> {
  //   return new Promise((resolve) => {
  //     setState(before => ({
  //       ...before,
  //       returnListener: {f: newFilePath => resolve(newFilePath)},
  //       title: "Select File",
  //       confirmActionText: "Select",
  //       root: rootDirectory,
  //       startDirectory: rootDirectory,
  //       showTextBox: false,
  //       filter: filter,
  //       show: true,
  //     }))
  //   })
  // }

  async function onServerFileSelected(newFilePath: string): Promise<void> {
    const listener = state.returnListener
    setState(before => ({
      ...before,
      returnListener: null,
      show: false,
    }))
    // TODO: This leaves a promise hanging, right? Should we make a better effort to clean that up?
    if (!newFilePath) {
      return
    }
    assert(listener !== null, "Who is waiting for file browser?")
    listener.f(newFilePath)
  }

return <>
    {state.show && <div className="modal-backdrop">
      <div className="modal-body">
        <FileBrowser
              confirmActionText={state.confirmActionText}
              initialDirectory={state.startDirectory}
              initialFileName={state.startFileName}
              rootDirectory={state.root}
              server={server}
              filter={state.filter}
              showUpload={false}
              showTextBox={state.showTextBox}
              title={state.title}
              onFileSelected={onServerFileSelected}
          />
      </div>
    </div>}
    {children}
  </>
}
