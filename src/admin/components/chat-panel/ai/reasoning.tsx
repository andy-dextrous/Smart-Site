"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/admin/components/ui/collapsible";
import { cn } from "@/admin/utilities/ui";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext, useEffect, useRef, useState } from "react";
import { Response } from "./response";

export const reasoningStyles = /* css */ `
.chat-reasoning {
  margin-bottom: 16px;
}

.chat-reasoning__trigger {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--chat-color-text-secondary);
  background: transparent;
  padding: 4px 8px;
  border-radius: var(--chat-radius-sm);
  transition: color 0.2s ease, background 0.2s ease;
}

.chat-reasoning__trigger:hover {
  color: var(--chat-color-text-primary);
  background: color-mix(in srgb, var(--chat-color-layer-1) 80%, transparent);
}

.chat-reasoning__icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  opacity: 0.75;
}

.chat-reasoning__chevron {
  width: 16px;
  height: 16px;
  color: currentColor;
  opacity: 0.7;
  transition: transform 0.2s ease;
}

.chat-reasoning__trigger[data-state="open"] .chat-reasoning__chevron {
  transform: rotate(180deg);
}

.chat-reasoning__content {
  margin-top: 8px;
  font-size: 14px;
  color: var(--chat-color-text-secondary);
  background: color-mix(in srgb, var(--chat-color-layer-1) 60%, transparent);
  border-radius: var(--chat-radius-md);
  padding: 12px;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-reasoning__content[data-state="closed"] {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}

.chat-reasoning__content[data-state="open"] {
  opacity: 1;
  transform: translateY(0);
}

.chat-reasoning__body {
  display: grid;
  gap: 8px;
}
`

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = true,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });
    const [duration, setDuration] = useControllableState({
      prop: durationProp,
      defaultProp: 0,
    });

    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const startTimeRef = useRef<number | null>(null);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }
      } else if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming, setDuration]);

    // Auto-open when streaming starts, auto-close when streaming ends (once only)
    useEffect(() => {
      if (defaultOpen && !isStreaming && isOpen && !hasAutoClosed) {
        // Add a small delay before closing to allow user to see the content
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosed(true);
        }, AUTO_CLOSE_DELAY);

        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosed]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
    };

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen, duration }}
      >
        <Collapsible
          className={cn("chat-reasoning", className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger>;

const getThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <p>Thinking...</p>;
  }
  if (duration === undefined) {
    return <p>Thought for a few seconds</p>;
  }
  return <p>Thought for {duration} seconds</p>;
};

export const ReasoningTrigger = memo(
  ({ className, children, ...props }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn("chat-reasoning__trigger", className)}
        {...props}
      >
        {children ?? (
          <>
            <BrainIcon className="chat-reasoning__icon" />
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon className="chat-reasoning__chevron" />
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <CollapsibleContent
      className={cn("chat-reasoning__content", className)}
      {...props}
    >
      <Response className="chat-reasoning__body">{children}</Response>
    </CollapsibleContent>
  )
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
