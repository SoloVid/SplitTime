import PixelSizingControls from "../pixel-sizing-controls"

export type MenuBarProps = {
  editSettings: () => void
  openFileSave: () => void
}

export default function MenuBar(props: MenuBarProps) {
  const {
    editSettings,
    openFileSave,
  } = props

  return <div className="menu-bar">
    <a href="/edit" target="_blank">Menu</a>
    <a onClick={openFileSave}>Save</a>
    {editSettings && <>
      <a onClick={editSettings}>Edit Settings</a>
      <PixelSizingControls></PixelSizingControls>
    </>}
  </div>
}
