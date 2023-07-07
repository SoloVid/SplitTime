import { createContext } from "preact";
import { useMemo, useState } from "preact/hooks";
import { ImmutableSetter } from "../utils/preact-help";
import FileBrowser from "./file-browser";
import { assert } from "globals";
import { ServerLiaison } from "../common/server-liaison";

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
  readonly showFileSelectPopup: (settings: Partial<Omit<FilePopupState, "show" | "returnListener">>) => PromiseLike<string>
  // readonly openFileSave: () => void
  // readonly openFileSelect: (rootDirectory: string, filter?: RegExp) => PromiseLike<string>
}

export function useFilePopupControls(): FilePopupControls {
  const [state, setState] = useFilePopupState()
  return useMemo<FilePopupControls>(() => ({
    async showFileSelectPopup(settings) {
      const returnedPath = await new Promise<string>((resolve) => {
        setState(before => ({
          ...before,
          title: "Select File",
          confirmActionText: "Select",
          root: "",
          startDirectory: "",
          showTextBox: false,
          filter: undefined,
          ...settings,
          returnListener: {f: newFilePath => resolve(newFilePath)},
          show: true,
        }))
      })
      return returnedPath
    },
  }), [setState])
}

export const FilePopupContext = createContext<FilePopupControls>({
  showFileSelectPopup: async () => "",
  // openFileSave: async () => undefined,
  // openFileSelect: async () => "",
})

type Props = {
  // state: FilePopupState
  // setState: ImmutableSetter<FilePopupState>
  children: any
  server: ServerLiaison
}

export function FilePopupContextProvider({children, server}: Props) {
  const [state, setState] = useFilePopupState()
  // const popupControls = useFilePopupControls()

  // function openFileSave(): void {
  //   const filter = level !== null ? /\.lvl\.yml$/ : (collage !== null ? /\.clg\.yml$/ : undefined)
  //   const lastSlash = filePath.lastIndexOf("/")
  //   const preloadDirectory = filePath.substring(0, lastSlash)
  //   const preloadFileName = filePath.substring(lastSlash + 1)
  //   setState((before) => ({
  //     ...before,
  //     show: true,
  //     returnListener: { f: async newFilePath => {
  //       doSave(newFilePath)
  //       setFilePath(newFilePath, editorType)
  //     } },
  //     title: "Save File As",
  //     confirmActionText: "Save",
  //     root: "",
  //     startDirectory: preloadDirectory,
  //     showTextBox: true,
  //     filter: filter,
  //     startFileName: preloadFileName,
  //   }))
  // }

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

  const value = useMemo<FilePopupControls>(() => {
    return {
      showFileSelectPopup: (settings) => {
        return new Promise((resolve) => {
          setState((before) => ({
            // ...before,
            // show: true,
            // returnListener: {f: newFilePath => resolve(newFilePath)},
            // ...settings,

            ...before,
            title: "Select File",
            confirmActionText: "Select",
            root: "",
            startDirectory: "",
            showTextBox: false,
            filter: undefined,
            ...settings,
            returnListener: {f: newFilePath => resolve(newFilePath)},
            show: true,
          }))
        })
      }
    }
  }, [setState])

  return <FilePopupContext.Provider value={value}>
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
  </FilePopupContext.Provider>
}
