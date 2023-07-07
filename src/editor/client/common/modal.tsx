import { useRef } from "preact/hooks"
import { onlyLeft } from "../utils/preact-help"

type ModalProps = {
  children: any
  close: () => void
}

export default function Modal({ children, close }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  function backdropClickHandler(event: MouseEvent) {
    if (event.target !== backdropRef.current) {
      return
    }
    close()
  }

  return <div ref={backdropRef} className="modal-backdrop" onClick={onlyLeft(backdropClickHandler, true)}>
    <div className="modal-body">
      {children}
    </div>
  </div>
}
