import * as React from "react"

const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={20}
    height={2}
    viewBox="0 0 20 2"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1 1H19"
      stroke="currentColor"
      strokeWidth={1.33333}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default MinusIcon
