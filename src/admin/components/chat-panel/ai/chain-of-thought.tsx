"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Badge } from "@/admin/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/admin/components/ui/collapsible";
import { cn } from "@/admin/utilities/ui";
import {
  BrainIcon,
  ChevronDownIcon,
  DotIcon,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext } from "react";

export const chainOfThoughtStyles = /* css */ `
.chat-chain {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 66ch;
}

.chat-chain__trigger {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--chat-color-text-secondary);
  transition: color 0.2s ease;
}

.chat-chain__trigger:hover {
  color: var(--chat-color-text-primary);
}

.chat-chain__trigger-label {
  flex: 1;
  text-align: left;
}

.chat-chain__trigger-icon,
.chat-chain__trigger-chevron,
.chat-chain__step-icon,
.chat-chain__nav-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.chat-chain__trigger-chevron {
  transition: transform 0.2s ease;
}

.chat-chain__trigger[data-state="open"] .chat-chain__trigger-chevron {
  transform: rotate(180deg);
}

.chat-chain__step {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: var(--chat-color-text-secondary);
  animation: chat-chain-step-in 0.18s ease;
}

.chat-chain__step--active {
  color: var(--chat-color-text-primary);
}

.chat-chain__step--pending {
  color: color-mix(in srgb, var(--chat-color-text-secondary) 50%, transparent);
}

.chat-chain__step-indicator {
  position: relative;
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chat-chain__step-connector {
  position: absolute;
  top: 28px;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: var(--chat-color-border);
}

.chat-chain__step:last-child .chat-chain__step-connector {
  display: none;
}

.chat-chain__step-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-chain__step-description {
  font-size: 12px;
  color: var(--chat-color-text-secondary);
}

.chat-chain__search-results {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-chain__search-result {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 400;
}

.chat-chain__content {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--chat-color-text-secondary);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-chain__content[data-state="closed"] {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}

.chat-chain__content[data-state="open"] {
  opacity: 1;
  transform: translateY(0);
}

@keyframes chat-chain-step-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-chain__image {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-chain__image-frame {
  position: relative;
  display: flex;
  max-height: 22rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--chat-radius-md);
  background: color-mix(in srgb, var(--chat-color-layer-1) 70%, transparent);
  padding: 12px;
}

.chat-chain__image-caption {
  font-size: 12px;
  color: var(--chat-color-text-secondary);
}
`

type ChainOfThoughtContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
  null
);

const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "ChainOfThought components must be used within ChainOfThought"
    );
  }
  return context;
};

export type ChainOfThoughtProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    return (
      <ChainOfThoughtContext.Provider value={{ isOpen, setIsOpen }}>
        <div className={cn("chat-chain", className)} {...props}>
          {children}
        </div>
      </ChainOfThoughtContext.Provider>
    );
  }
);

export type ChainOfThoughtHeaderProps = ComponentProps<
  typeof CollapsibleTrigger
>;

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
    const { isOpen, setIsOpen } = useChainOfThought();

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          className={cn("chat-chain__trigger", className)}
          {...props}
        >
          <BrainIcon className="chat-chain__trigger-icon" />
          <span className="chat-chain__trigger-label">
            {children ?? "Chain of Thought"}
          </span>
          <ChevronDownIcon className="chat-chain__trigger-chevron" />
        </CollapsibleTrigger>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
  icon?: LucideIcon;
  label: string;
  description?: string;
  status?: "complete" | "active" | "pending";
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = "complete",
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    const statusStyles = {
      complete: "chat-chain__step--complete",
      active: "chat-chain__step--active",
      pending: "chat-chain__step--pending",
    } as const;

    return (
      <div
        className={cn("chat-chain__step", statusStyles[status], className)}
        {...props}
      >
        <div className="chat-chain__step-indicator">
          <Icon className="chat-chain__step-icon" />
          <div className="chat-chain__step-connector" />
        </div>
        <div className="chat-chain__step-body">
          <div>{label}</div>
          {description && <div className="chat-chain__step-description">{description}</div>}
          {children}
        </div>
      </div>
    );
  }
);

export type ChainOfThoughtSearchResultsProps = ComponentProps<"div">;

export const ChainOfThoughtSearchResults = memo(
  ({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
    <div className={cn("chat-chain__search-results", className)} {...props} />
  )
);

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>;

export const ChainOfThoughtSearchResult = memo(
  ({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
    <Badge
      className={cn("chat-chain__search-result", className)}
      variant="secondary"
      {...props}
    >
      {children}
    </Badge>
  )
);

export type ChainOfThoughtContentProps = ComponentProps<
  typeof CollapsibleContent
>;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    const { isOpen } = useChainOfThought();

    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent
          className={cn("chat-chain__content", className)}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtImageProps = ComponentProps<"div"> & {
  caption?: string;
};

export const ChainOfThoughtImage = memo(
  ({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
    <div className={cn("chat-chain__image", className)} {...props}>
      <div className="chat-chain__image-frame">
        {children}
      </div>
      {caption && <p className="chat-chain__image-caption">{caption}</p>}
    </div>
  )
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";
