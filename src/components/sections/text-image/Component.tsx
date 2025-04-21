import RichText from "@/payload/components/rich-text"
import { cn } from "@/utilities/ui"
import { CMSLink } from "@/payload/components/cms-link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import type {
  Media,
  TextImageBlock as TextImageBlockProps,
} from "@/payload/payload-types"

export const TextImageComponent: React.FC<TextImageBlockProps> = props => {
  const { heading, content, image: imageProp, imagePosition, buttons } = props
  const image = imageProp as Media

  const imageUrl = image?.url || "https://picsum.photos/700/400"

  return (
    <section>
      <div
        className={cn(
          "container flex gap-8",
          imagePosition === "right" ? "flex-row" : "flex-row-reverse"
        )}
      >
        <div className="flex flex-1 flex-col items-start gap-4">
          <h2 className="text-2xl font-bold">{heading}</h2>
          <div className="prose max-w-none">
            <RichText data={content} />
          </div>

          {buttons && (
            <div className="flex gap-4">
              {buttons.map((button: any) => {
                const appearance = button.link.appearance || "default"

                return (
                  <CMSLink {...button.link}>
                    <Button key={button.id} variant={appearance}>
                      {button.link.label}
                    </Button>
                  </CMSLink>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col items-start gap-4">
          <div className="relative h-full max-h-[400px] min-h-[400px] w-full">
            {/* <Media resource={image} /> */}
            <Image src={imageUrl} alt={image?.alt || ""} fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}
