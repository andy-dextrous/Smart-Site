import Image from "next/image"

export const Logo = () => {
  return (
    <span style={{ position: "relative", width: "256px", height: "40px" }}>
      <Image src="/assets/admin/logos/logo.svg" alt="" fill />
    </span>
  )
}

export const Icon = () => {
  return (
    <span
      style={{
        position: "relative",
        width: "120px",
        height: "36px",
        marginRight: "20px",
      }}
    >
      <Image src="/assets/admin/logos/logo.svg" alt="" fill />
    </span>
  )
}
