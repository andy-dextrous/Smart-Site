import * as React from "react"

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1 11H9"
      stroke="currentColor"
      strokeWidth={1.33333}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 11L21 11"
      stroke="currentColor"
      strokeWidth={1.33333}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 2V9"
      stroke="currentColor"
      strokeWidth={1.33333}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 13V20"
      stroke="currentColor"
      strokeWidth={1.33333}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default PlusIcon
