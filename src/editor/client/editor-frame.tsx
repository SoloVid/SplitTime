import MenuBar from "./menu-bar"
import { GlobalEditorPreferencesContextProvider } from "./preferences/global-preferences"
import { UserInputsContextProvider } from "./user-inputs"

type Props = {
  children: any
  editorPreferencesId: string
}

export default function EditorFrame({
  children,
  editorPreferencesId,
}: Props) {
  return <div
  className="editor"
  style="display: flex; flex-flow: column; height: 100vh;"
>
  <GlobalEditorPreferencesContextProvider id={editorPreferencesId}>
    <MenuBar
      editSettings={() => {}} // TODO: Implement editSettings
      openFileSave={() => {}} // TODO: Implement openFileSave
    ></MenuBar>
    <UserInputsContextProvider>
      {children}
    </UserInputsContextProvider>
  </GlobalEditorPreferencesContextProvider>
</div>
}
