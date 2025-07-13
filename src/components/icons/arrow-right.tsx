import { cn } from "@/utilities/ui"
import * as React from "react"

const ArrowRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={15}
    viewBox="0 0 24 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-6 w-6", className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22.977 6.44895C20.4829 6.44895 18.2097 4.11456 18.2097 1.55105V0.5H16.1637V1.55105C16.1637 3.41561 16.9596 5.16456 18.2087 6.44895H0V8.55105H18.2087C16.9596 9.83544 16.1637 11.5844 16.1637 13.4489V14.5H18.2097V13.4489C18.2097 10.8854 20.4829 8.55105 22.977 8.55105H24V6.44895H22.977Z"
      fill="currentColor"
    />
  </svg>
)

export default ArrowRightIcon
