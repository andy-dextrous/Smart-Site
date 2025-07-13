import * as React from "react"

const SpeechBubble = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={26}
    height={24}
    viewBox="0 0 26 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_691_1204)">
      <path
        d="M13 9.66669V9.68002"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.66602 9.66669V9.68002"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.334 9.66669V9.68002"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 0.333313C22.0609 0.333313 23.0783 0.75474 23.8284 1.50489C24.5786 2.25503 25 3.27245 25 4.33331V15C25 16.0608 24.5786 17.0783 23.8284 17.8284C23.0783 18.5786 22.0609 19 21 19H14.3333L7.66667 23V19H5C3.93913 19 2.92172 18.5786 2.17157 17.8284C1.42143 17.0783 1 16.0608 1 15V4.33331C1 3.27245 1.42143 2.25503 2.17157 1.50489C2.92172 0.75474 3.93913 0.333313 5 0.333313H21Z"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_691_1204">
        <rect width={25} height={24} fill="white" transform="translate(0.5)" />
      </clipPath>
    </defs>
  </svg>
)

export default SpeechBubble
