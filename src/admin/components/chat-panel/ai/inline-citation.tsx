"use client";

import { Badge } from "@/admin/components/ui/badge";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/admin/components/ui/carousel";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/admin/components/ui/hover-card";
import { cn } from "@/admin/utilities/ui";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

export const inlineCitationStyles = /* css */ `
.chat-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chat-inline__text {
  border-radius: var(--chat-radius-sm);
  transition: background 0.2s ease;
}

.chat-inline:hover .chat-inline__text {
  background: rgba(79, 55, 251, 0.12);
}

.chat-inline__badge {
  margin-left: 4px;
  border-radius: 999px;
}

.chat-inline__card-body {
  position: relative;
  width: 320px;
  padding: 0;
}

.chat-inline__carousel {
  width: 100%;
}

.chat-inline__carousel-item {
  width: 100%;
  padding: 16px;
  padding-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-inline__carousel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--chat-color-layer-1);
  padding: 8px;
  border-top-left-radius: var(--chat-radius-md);
  border-top-right-radius: var(--chat-radius-md);
}

.chat-inline__carousel-index {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--chat-color-text-secondary);
}

.chat-inline__nav-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.chat-inline__nav-button:hover {
  background: var(--chat-color-layer-2);
}

.chat-inline__nav-icon {
  width: 16px;
  height: 16px;
  color: var(--chat-color-text-secondary);
}

.chat-inline__source {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-inline__source-title {
  font-size: 14px;
  line-height: 1.3;
  font-weight: 600;
  color: var(--chat-color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-inline__source-url {
  font-size: 12px;
  color: var(--chat-color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-inline__source-description {
  font-size: 14px;
  line-height: 1.5;
  color: var(--chat-color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chat-inline__quote {
  border-left: 2px solid var(--chat-color-border);
  padding-left: 12px;
  font-size: 14px;
  font-style: italic;
  color: var(--chat-color-text-secondary);
}

.chat-inline__icon {
  width: 16px;
  height: 16px;
  color: var(--chat-color-text-secondary);
}
`

export type InlineCitationProps = ComponentProps<"span">;

export const InlineCitation = ({
  className,
  ...props
}: InlineCitationProps) => (
  <span className={cn("chat-inline", className)} {...props} />
);

export type InlineCitationTextProps = ComponentProps<"span">;

export const InlineCitationText = ({
  className,
  ...props
}: InlineCitationTextProps) => (
  <span className={cn("chat-inline__text", className)} {...props} />
);

export type InlineCitationCardProps = ComponentProps<typeof HoverCard>;

export const InlineCitationCard = (props: InlineCitationCardProps) => (
  <HoverCard closeDelay={0} openDelay={0} {...props} />
);

export type InlineCitationCardTriggerProps = ComponentProps<typeof Badge> & {
  sources: string[];
};

export const InlineCitationCardTrigger = ({
  sources,
  className,
  ...props
}: InlineCitationCardTriggerProps) => (
  <HoverCardTrigger asChild>
    <Badge
      className={cn("chat-inline__badge", className)}
      variant="secondary"
      {...props}
    >
      {sources.length ? (
        <>
          {new URL(sources[0]).hostname}{" "}
          {sources.length > 1 && `+${sources.length - 1}`}
        </>
      ) : (
        "unknown"
      )}
    </Badge>
  </HoverCardTrigger>
);

export type InlineCitationCardBodyProps = ComponentProps<"div">;

export const InlineCitationCardBody = ({
  className,
  ...props
}: InlineCitationCardBodyProps) => (
  <HoverCardContent className={cn("chat-inline__card-body", className)} {...props} />
);

const CarouselApiContext = createContext<CarouselApi | undefined>(undefined);

const useCarouselApi = () => {
  const context = useContext(CarouselApiContext);
  return context;
};

export type InlineCitationCarouselProps = ComponentProps<typeof Carousel>;

export const InlineCitationCarousel = ({
  className,
  children,
  ...props
}: InlineCitationCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();

  return (
    <CarouselApiContext.Provider value={api}>
      <Carousel
        className={cn("chat-inline__carousel", className)}
        setApi={setApi}
        {...props}
      >
        {children}
      </Carousel>
    </CarouselApiContext.Provider>
  );
};

export type InlineCitationCarouselContentProps = ComponentProps<"div">;

export const InlineCitationCarouselContent = (
  props: InlineCitationCarouselContentProps
) => <CarouselContent {...props} />;

export type InlineCitationCarouselItemProps = ComponentProps<"div">;

export const InlineCitationCarouselItem = ({
  className,
  ...props
}: InlineCitationCarouselItemProps) => (
  <CarouselItem className={cn("chat-inline__carousel-item", className)} {...props} />
);

export type InlineCitationCarouselHeaderProps = ComponentProps<"div">;

export const InlineCitationCarouselHeader = ({
  className,
  ...props
}: InlineCitationCarouselHeaderProps) => (
  <div className={cn("chat-inline__carousel-header", className)} {...props} />
);

export type InlineCitationCarouselIndexProps = ComponentProps<"div">;

export const InlineCitationCarouselIndex = ({
  children,
  className,
  ...props
}: InlineCitationCarouselIndexProps) => {
  const api = useCarouselApi();
  const [, rerender] = useReducer((count) => count + 1, 0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = () => {
      rerender();
    };

    api.on("select", handleSelect);
    api.on?.("reInit", handleSelect);

    return () => {
      api.off?.("select", handleSelect);
      api.off?.("reInit", handleSelect);
    };
  }, [api, rerender]);

  const count = api?.scrollSnapList().length ?? 0;
  const current = api ? api.selectedScrollSnap() + 1 : 0;

  return (
    <div className={cn("chat-inline__carousel-index", className)} {...props}>
      {children ?? `${current}/${count}`}
    </div>
  );
};

export type InlineCitationCarouselPrevProps = ComponentProps<"button">;

export const InlineCitationCarouselPrev = ({
  className,
  ...props
}: InlineCitationCarouselPrevProps) => {
  const api = useCarouselApi();

  const handleClick = useCallback(() => {
    if (api) {
      api.scrollPrev();
    }
  }, [api]);

  return (
    <button
      aria-label="Previous"
      className={cn("chat-inline__nav-button", className)}
      onClick={handleClick}
      type="button"
      {...props}
    >
      <ArrowLeftIcon className="chat-inline__nav-icon" />
    </button>
  );
};

export type InlineCitationCarouselNextProps = ComponentProps<"button">;

export const InlineCitationCarouselNext = ({
  className,
  ...props
}: InlineCitationCarouselNextProps) => {
  const api = useCarouselApi();

  const handleClick = useCallback(() => {
    if (api) {
      api.scrollNext();
    }
  }, [api]);

  return (
    <button
      aria-label="Next"
      className={cn("chat-inline__nav-button", className)}
      onClick={handleClick}
      type="button"
      {...props}
    >
      <ArrowRightIcon className="chat-inline__nav-icon" />
    </button>
  );
};

export type InlineCitationSourceProps = ComponentProps<"div"> & {
  title?: string;
  url?: string;
  description?: string;
};

export const InlineCitationSource = ({
  title,
  url,
  description,
  className,
  children,
  ...props
}: InlineCitationSourceProps) => (
  <div className={cn("chat-inline__source", className)} {...props}>
    {title && <h4 className="chat-inline__source-title">{title}</h4>}
    {url && <p className="chat-inline__source-url">{url}</p>}
    {description && <p className="chat-inline__source-description">{description}</p>}
    {children}
  </div>
);

export type InlineCitationQuoteProps = ComponentProps<"blockquote">;

export const InlineCitationQuote = ({
  children,
  className,
  ...props
}: InlineCitationQuoteProps) => (
  <blockquote
    className={cn("chat-inline__quote", className)}
    {...props}
  >
    {children}
  </blockquote>
);
