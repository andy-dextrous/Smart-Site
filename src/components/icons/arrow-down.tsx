import { cn } from "@/utilities/ui"
import * as React from "react"

const ArrowDownIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={12}
    height={18}
    viewBox="0 0 12 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-6 w-6", className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.82582 17.2327C6.82582 15.3621 8.65999 13.6573 10.6742 13.6573L11.5 13.6573L11.5 12.1228L10.6742 12.1228C9.20916 12.1228 7.83499 12.7197 6.82582 13.6566L6.82582 -2.04315e-07L5.17417 -2.76511e-07L5.17417 13.6566C4.16501 12.7197 2.79084 12.1228 1.32583 12.1228L0.5 12.1228L0.5 13.6573L1.32583 13.6573C3.34001 13.6573 5.17417 15.3621 5.17417 17.2327L5.17417 18L6.82582 18L6.82582 17.2327Z"
      fill="currentColor"
    />
  </svg>
)
export default ArrowDownIcon
