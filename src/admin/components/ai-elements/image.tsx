import NextImage from "next/image";

import { cn } from "@/admin/utilities/ui";
import type { Experimental_GeneratedImage } from "ai";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export function Image({
  base64,
  mediaType,
  className,
  alt,
  width,
  height,
}: ImageProps) {
  const dataUrl = `data:${mediaType};base64,${base64}`;

  return (
    <NextImage
      alt={alt ?? ""}
      className={cn(
        "h-auto max-w-full overflow-hidden rounded-md",
        className
      )}
      height={height ?? 1024}
      sizes="100vw"
      src={dataUrl}
      unoptimized
      width={width ?? 1024}
    />
  );
}
