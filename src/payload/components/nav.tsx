import Link from "next/link"

export default function Nav() {
  const navItems = [
    {
      label: "Home",
      href: "/",
    },
  ]

  return (
    <div>
      <h1>Nav</h1>
      {navItems.map(item => (
        <Link href={item.href}>{item.label}</Link>
      ))}
    </div>
  )
}
