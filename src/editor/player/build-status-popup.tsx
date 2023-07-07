import { onlyLeft } from "../client/utils/preact-help"
import { PopupState } from "./player-state"

type BuildStatusPopupProps = {
  state: PopupState
  setState: (modify: (old: PopupState) => PopupState) => void
}

export default function BuildStatusPopup({
  state,
  setState,
}: BuildStatusPopupProps) {
  const {
    messageType,
    htmlContent,
  } = state
  return <div className="status-popup-container">
    <div className={`status-popup ${getMessageTypeClass(messageType)}`}>
      <div className="message" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
      <span
        className="icon-button"
        title="Dismiss message"
        onClick={onlyLeft(() => setState(old => ({...old, isVisible: false})))}
      >✖</span>
    </div>
  </div>
}

function getMessageTypeClass(messageType: string) {
  switch (messageType) {
    case "success":
      return "success"
    case "info":
      return "info"
    case "error":
      return "error"
  }
  return ""
}
