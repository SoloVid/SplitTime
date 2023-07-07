import { useContext } from "preact/hooks"
import { CheckboxInput, NumberInput } from "./common/input"
import { GlobalEditorPreferencesContext } from "./preferences/global-preferences"

export default function PixelSizingControls() {
  const [preferences, setPreferences] = useContext(GlobalEditorPreferencesContext)

  return <>
    <label className="margin-right">
      Grid:
      <CheckboxInput value={preferences.gridEnabled} onChange={(b) => setPreferences((p) => ({...p, gridEnabled: b}))} />
    </label>
    {preferences.gridEnabled && <>
      <label className="margin-right">
        x:
        <NumberInput
          value={preferences.gridCell.x}
          onChange={(x) => setPreferences((p) => ({...p, gridCell: {...p.gridCell, x: x}}))}
          style="width: 48px;"
        />
      </label>
      <label className="margin-right">
        y:
        <NumberInput
          value={preferences.gridCell.y}
          onChange={(y) => setPreferences((p) => ({...p, gridCell: {...p.gridCell, y: y}}))}
          style="width: 48px;"
        />
      </label>
    </>}
    <label className="margin-right">
        Zoom:
        <NumberInput
          step={10}
          value={preferences.zoom}
          onChange={(z) => setPreferences((p) => ({...p, zoom: z}))}
          style="width: 48px;"
        />%
    </label>
  </>
}
