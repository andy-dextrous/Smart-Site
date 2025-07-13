interface LogoipLorumProps {
  className?: string
  fill?: string
}

function LogoipLorum({ className, fill = "#F0F0F0" }: LogoipLorumProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 25 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.02797 13.2932H1.98793V30.7847H18.6783V26.128H8.02797V13.2932Z"
        fill={fill}
      />
    </svg>
  )
}

export default LogoipLorum
