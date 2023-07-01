import { FilePopupContextProvider } from "./file-popup"
import MenuBar from "./menu-bar"
import { GlobalEditorPreferencesContextProvider } from "./preferences/global-preferences"
import { ServerLiaison } from "./server-liaison"
import { UserInputsContextProvider } from "./user-inputs"

type Props = {
  children: any
  editorPreferencesId: string
  server: ServerLiaison
}

export default function EditorFrame({
  children,
  editorPreferencesId,
  server,
}: Props) {
  return <div
  className="editor"
  style="display: flex; flex-flow: column; height: 100vh;"
>
  <GlobalEditorPreferencesContextProvider id={editorPreferencesId}>
    <FilePopupContextProvider server={server}>
      {/* <MenuBar
        editSettings={() => {}} // TODO: Implement editSettings
        // openFileSave={() => {}} // TODO: Implement openFileSave
      ></MenuBar> */}
      <UserInputsContextProvider>
        {children}
      </UserInputsContextProvider>
    </FilePopupContextProvider>
  </GlobalEditorPreferencesContextProvider>
</div>
}
