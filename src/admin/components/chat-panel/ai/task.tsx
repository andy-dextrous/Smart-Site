"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/admin/components/ui/collapsible";
import { cn } from "@/admin/utilities/ui";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

export const taskStyles = /* css */ `
.chat-task__file {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--chat-color-border);
  background: var(--chat-color-layer-1);
  color: var(--chat-color-text-primary);
  padding: 2px 6px;
  border-radius: var(--chat-radius-sm);
  font-size: 12px;
}

.chat-task__item {
  font-size: 14px;
  color: var(--chat-color-text-secondary);
}

.chat-task {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-task__trigger {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--chat-color-text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.chat-task__trigger:hover {
  color: var(--chat-color-text-primary);
}

.chat-task__trigger-icon,
.chat-task__trigger-chevron {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.chat-task__trigger-title {
  font-size: 14px;
  font-weight: 600;
}

.chat-task__trigger .chat-task__trigger-chevron {
  transition: transform 0.2s ease;
}

.chat-task__trigger[data-state="open"] .chat-task__trigger-chevron {
  transform: rotate(180deg);
}

.chat-task__content {
  font-size: 14px;
  color: var(--chat-color-text-primary);
  padding: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-task__content[data-state="closed"] {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}

.chat-task__content[data-state="open"] {
  opacity: 1;
  transform: translateY(0);
}

.chat-task__content-inner {
  margin-top: 16px;
  padding-left: 16px;
  border-left: 2px solid var(--chat-color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
`

export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = ({
  children,
  className,
  ...props
}: TaskItemFileProps) => (
  <div className={cn("chat-task__file", className)} {...props}>
    {children}
  </div>
);

export type TaskItemProps = ComponentProps<"div">;

export const TaskItem = ({ children, className, ...props }: TaskItemProps) => (
  <div className={cn("chat-task__item", className)} {...props}>
    {children}
  </div>
);

export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({
  defaultOpen = true,
  className,
  ...props
}: TaskProps) => (
  <Collapsible
    className={cn("chat-task", className)}
    defaultOpen={defaultOpen}
    {...props}
  />
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
};

export const TaskTrigger = ({
  children,
  className,
  title,
  ...props
}: TaskTriggerProps) => (
  <CollapsibleTrigger asChild {...props}>
    {children ?? (
      <div className={cn("chat-task__trigger", className)}>
        <SearchIcon className="chat-task__trigger-icon" />
        <p className="chat-task__trigger-title">{title}</p>
        <ChevronDownIcon className="chat-task__trigger-chevron" />
      </div>
    )}
  </CollapsibleTrigger>
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({
  children,
  className,
  ...props
}: TaskContentProps) => (
  <CollapsibleContent
    className={cn("chat-task__content", className)}
    {...props}
  >
    <div className="chat-task__content-inner">
      {children}
    </div>
  </CollapsibleContent>
);
