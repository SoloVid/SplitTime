import { createContext } from "preact"
import { ImmutableSetter } from "./preact-help"
import { useState } from "preact/hooks"

export const InfoPaneContext = createContext<[Record<string, string | number>, ImmutableSetter<Record<string, string | number>>]>([{}, () => undefined])

type InfoPaneProps = {
  children: any
}

export default function InfoPaneFrame({ children }: InfoPaneProps) {
  const [info, setInfo] = useState<Record<string, string | number>>({})

  return <InfoPaneContext.Provider value={[info, setInfo]}>
    {children}
    <InfoPane
      info={info}
    ></InfoPane>
  </InfoPaneContext.Provider>
}

function InfoPane(props: { info: Record<string, string | number> }) {
  return <div id="info-pane" style="padding: 2px;">
    {Object.entries(props.info).map(([name, value]) => (
      <span key={name} className="info-key-value">
        {name}: {value}
      </span>
    ))}
  </div>
}
