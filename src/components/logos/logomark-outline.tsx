import * as React from "react"

const SVGComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Layer_2"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 399.01 625.48"
    {...props}
  >
    <defs>
      <style>
        {
          ".logomark-outline-cls-1{fill:none;stroke:url(#logomark-outline-linear-gradient);stroke-miterlimit:10;stroke-width:1px;}"
        }
      </style>
      <linearGradient
        id="logomark-outline-linear-gradient"
        x1={0}
        y1={312.74}
        x2={399.01}
        y2={312.74}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#4242f3" />
        <stop offset={0.98} stopColor="#7539a1" />
      </linearGradient>
    </defs>
    <g id="Layer_1-2">
      <path
        className="logomark-outline-cls-1"
        d="M170.52,388.18l224.43,234.5L2.6,457.47l167.92-69.29ZM170.97,387.99l163.2-67.34-6.09-315.8-157.11,383.14Z"
      />
    </g>
  </svg>
)

export default SVGComponent
