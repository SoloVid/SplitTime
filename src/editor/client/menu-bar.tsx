import PixelSizingControls from "./pixel-sizing-controls"

export default function MenuBar() {
  return <div className="menu-bar">
    <a href="/edit" target="_blank">Menu</a>
    <a onClick={openFileSave}>Save</a>
    {(collage || level) && <>
      <a onClick={editSettings}>Edit Settings</a>
      <PixelSizingControls></PixelSizingControls>
    </>}
  </div>
}
