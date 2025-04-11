import { Button } from "@/components/ui/button"
import { Media } from "@/payload/components/media"
import RichText from "@/payload/components/rich-text"
import { cn } from "@/utilities/ui"
import { CMSLink } from "@/payload/components/cms-link"
import type { TextImageBlock as TextImageBlockProps } from "@/payload/payload-types"

export const TextImageComponent: React.FC<TextImageBlockProps> = props => {
  const { heading, content, image, imagePosition, buttons } = props

  console.log(buttons)

  return (
    <section>
      <div className="container flex gap-8">
        <div
          className={cn(
            "flex flex-1 flex-col items-start gap-4",
            imagePosition === "right" && "order-2"
          )}
        >
          <h2 className="text-2xl font-bold">{heading}</h2>
          <div className="prose max-w-none">
            <RichText data={content} />
          </div>
          {buttons && (
            <div className="flex gap-4">
              {buttons.map((button: any) => (
                <CMSLink {...button.link} key={button.id} appearance="default" />
              ))}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex flex-1 flex-col items-start gap-4",
            imagePosition === "right" && "order-2"
          )}
        >
          <Media resource={image} />
        </div>
      </div>
    </section>
  )
}
