import * as React from "react"

const SVGComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Layer_2"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 258.63 407.26"
    {...props}
  >
    <defs>
      <style>{".cls-1{fill:url(#linear-gradient);}"}</style>
      <linearGradient
        id="linear-gradient"
        x1={0}
        y1={203.63}
        x2={258.63}
        y2={203.63}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#4242f3" />
        <stop offset={0.19} stopColor="#4641eb" />
        <stop offset={0.47} stopColor="#533ed6" />
        <stop offset={0.8} stopColor="#683bb5" />
        <stop offset={0.98} stopColor="#7539a1" />
      </linearGradient>
    </defs>
    <g id="Layer_1-2">
      <path
        className="cls-1"
        d="M110.69,252.68l147.94,154.58L0,298.35l110.69-45.67ZM110.99,252.56l107.58-44.39L214.55,0l-103.56,252.56Z"
      />
    </g>
  </svg>
)

export default SVGComponent
