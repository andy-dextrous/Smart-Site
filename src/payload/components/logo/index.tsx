import Image from "next/image"

export const Logo = () => {
  return (
    <span style={{ position: "relative", width: "256px", height: "40px" }}>
      <Image src="/logo.svg" alt="" fill />
    </span>
  )
}

export const Icon = () => {
  return (
    <span
      style={{
        position: "relative",
        width: "110px",
        height: "30px",
        marginRight: "20px",
      }}
    >
      <Image src="/logo.svg" alt="" fill />
    </span>
  )
}
