export default function SvgPatterns() {
  return (
    <svg
      id="common-svg-patterns"
      style="position: absolute; pointer-events: none;"
      width="0" height="0"
    >
      <defs>
        <pattern id="up-arrows-pattern" x="0" y="0" width="20" height="25" patternUnits="userSpaceOnUse">
          <polyline
            points="5,8 10,0 10,20 10,0 15,8"
            stroke="rgba(0, 0, 0, 0.7)" stroke-width="1.5" fill="none"
          ></polyline>
        </pattern>
        {/* From https://stackoverflow.com/a/14500054/4639640 */}
        <pattern id="diagonal-hatch" patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M-1,1 l2,-2
                     M0,4 l4,-4
                     M3,5 l2,-2"
            style="stroke:rgba(255, 0, 0, 0.7); stroke-width:1" />
        </pattern>
      </defs>
    </svg>
  );
}
