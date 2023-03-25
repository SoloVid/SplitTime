import { assert } from "globals"
import { useMemo, useRef } from "preact/hooks"
import { makeStyleString } from "../preact-help"
import { SharedStuffViewOnly, SharedStuff } from "./collage-editor-shared"
import { CollageHelper } from "./collage-helper"
import Montage from "./montage"

type CollageShowcaseProps = {
  style?: string
  collageEditHelper?: SharedStuff | undefined
  collageViewHelper: SharedStuffViewOnly
  $container: HTMLDivElement
}

export default function CollageShowcase(props: CollageShowcaseProps) {
  const {
    collageEditHelper,
    collageViewHelper,
    $container,
  } = props

  const collage = collageViewHelper.collage
  const scale = collageViewHelper.globalStuff.scale
  const $el = useRef<HTMLDivElement>(document.createElement("div"))
  // const maxMontageWidth = $el.current.offsetWidth
  // const maxMontageHeight = $el.current.offsetHeight
  const maxMontageWidth = $container.offsetWidth
  const maxMontageHeight = $container.offsetHeight

  const widestMontageWidth = useMemo(() => {
    const width = collageViewHelper.realCollage.montages.reduce((maxWidth, m) => {
      const mWidth = m.getOverallArea().width
      return Math.max(maxWidth, mWidth)
    }, 0)
    return Math.min(Math.max(width, 16), maxMontageWidth)
  }, [collageViewHelper, maxMontageWidth])

  const cellWidth = Math.min(widestMontageWidth * scale, maxMontageWidth)

  const gridStyle = useMemo(() => {
    const styleMap = {
      "position": "absolute",
      "width": "100%",
      "display": "grid",
      "grid-template-columns": "repeat(auto-fill, minmax(" + (cellWidth) + "px, 1fr))",
      "grid-gap": "0.5rem",
      "align-items": "center",
      "justify-items": "center"
    }
    return makeStyleString(styleMap)
  }, [cellWidth])

  function createNewMontage(): void {
    const collageHelper = new CollageHelper(collage)
    const newMontage = collageHelper.newMontage()
    const newMontageIndex = collage.montages.length
    assert(!!collageEditHelper, "Collage editor should be defined for montage editing")
    collageEditHelper.setCollage((before) => ({
      ...before,
      montages: [...before.montages, newMontage]
    }))
    collageEditHelper.selectMontage(newMontageIndex, true)
  }

  return <div ref={$el} style={`${gridStyle};${props.style ?? ""}`}>
    {collage.montages.map((m, i) => (
      <Montage
        collageEditHelper={collageEditHelper}
        collageViewHelper={collageViewHelper}
        montageIndex={i}
        montage={m}
        maxWidth={maxMontageWidth}
        maxHeight={maxMontageHeight}
      />
    ))}
    {collageEditHelper && <div
      onMouseDown={(e) => { if (e.button === 0) createNewMontage() }}
      title="Add montage"
      style="text-align: center; cursor: pointer;"
    >
      <i className="fas fa-plus fa-2x"></i>
    </div>}
  </div>
}