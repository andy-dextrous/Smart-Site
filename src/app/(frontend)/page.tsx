import Link from "next/link"

export default async function HomePage() {
  return (
    <section>
      <div className="container">
        <h1>This is a H1</h1>
        <h2>This is a H2</h2>
        <h3>This is a H3</h3>
        <h4>This is a H4</h4>
        <h5>This is a H5</h5>
        <h6>This is a H6</h6>
        <p>This is a paragraph</p>

        <ul>
          <li>This is a list item</li>
          <li>This is a list item</li>
          <li>This is a list item</li>
        </ul>

        <ol>
          <li>This is a list item</li>
          <li>This is a list item</li>
          <li>This is a list item</li>
        </ol>

        <Link href="#">This is a link</Link>
      </div>
    </section>
  )
}
