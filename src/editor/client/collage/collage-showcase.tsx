import { Collage } from "engine/file/collage"
import { Collage as RealCollage } from "engine/graphics/collage"
import { makeCollageFromFile } from "engine/graphics/collage"
import { Immutable } from "engine/utils/immutable"
import { assert } from "globals"
import { useContext, useMemo, useRef } from "preact/hooks"
import { ImmutableSetter, makeStyleString } from "../utils/preact-help"
import { CollageHelper } from "./collage-helper"
import Montage from "./montage"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import { CollageEditorControls } from "./collage-editor-shared"

type CollageShowcaseProps = {
  style?: string
  $container: HTMLDivElement | null
  collage: Immutable<Collage>
  controls: Pick<CollageEditorControls, "selectMontage">
  realCollage: RealCollage
  scale: number
  setCollage?: ImmutableSetter<Collage>
}

export default function CollageShowcase(props: CollageShowcaseProps) {
  const {
    $container,
    collage,
    controls,
    realCollage,
    scale,
    setCollage,
  } = props

  const [collagePrefs, setCollagePrefs] = useContext(CollageEditorPreferencesContext)

  const $el = useRef<HTMLDivElement>(document.createElement("div"))

  // const maxMontageWidth = $el.current.offsetWidth
  // const maxMontageHeight = $el.current.offsetHeight
  const maxMontageWidth = $container ? $container.offsetWidth : 64
  const maxMontageHeight = $container ? $container.offsetHeight : 64

  const widestMontageWidth = useMemo(() => {
    const width = realCollage.montages.reduce((maxWidth, m) => {
      const mWidth = m.getOverallArea().width
      return Math.max(maxWidth, mWidth)
    }, 0)
    return Math.min(Math.max(width, 16), maxMontageWidth)
  }, [realCollage, maxMontageWidth])

  const cellWidth = Math.min(widestMontageWidth * scale, maxMontageWidth)

  const gridStyle = useMemo(() => {
    const styleMap = {
      "position": "absolute",
      "width": "100%",
      "display": "grid",
      "grid-template-columns": "repeat(auto-fill, minmax(" + (cellWidth) + "px, 1fr))",
      "grid-gap": "4px",
      "align-items": "center",
      "justify-items": "center"
    }
    return makeStyleString(styleMap)
  }, [cellWidth])

  function createNewMontage(): void {
    const collageHelper = new CollageHelper(collage)
    const newMontage = collageHelper.newMontage()
    assert(!!setCollage, "setCollage should be defined for montage editing")
    setCollage((before) => ({
      ...before,
      montages: [...before.montages, newMontage]
    }))
    controls.selectMontage(newMontage)
  }

  const selectedMontage = useMemo(() => {
    return collage.montages.find(m => m.id === collagePrefs.montageSelected) ?? null
  }, [collagePrefs.montageSelected, collage.montages])

  return <div ref={$el} style={`${gridStyle};${props.style ?? ""}`}>
    {collage.montages.map((m, i) => (
      <Montage
        collage={collage}
        montageIndex={i}
        montage={m}
        maxWidth={maxMontageWidth}
        maxHeight={maxMontageHeight}
        realCollage={realCollage}
        scale={scale}
        selectedMontage={selectedMontage}
      />
    ))}
    {setCollage && <div
      onMouseDown={(e) => { if (e.button === 0) createNewMontage() }}
      title="Add montage"
      style="text-align: center; cursor: pointer;"
    >
      <i className="fas fa-plus fa-2x"></i>
    </div>}
  </div>
}