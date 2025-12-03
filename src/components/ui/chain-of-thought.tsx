/**
 * Chain of Thought UI Component
 * 
 * Visualizes AI agent reasoning process with collapsible steps,
 * search results, and progress indicators.
 */

"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown, Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/shadcn/badge";
import type { LucideIcon } from "lucide-react";
import type { StepStatus } from "@/types/multi-agent";

// ══════════════════════════════════════════════════════════
// CONTEXT
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtContextValue {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ChainOfThoughtContext = React.createContext<ChainOfThoughtContextValue | undefined>(
    undefined
);

function useChainOfThought() {
    const context = React.useContext(ChainOfThoughtContext);
    if (!context) {
        throw new Error("Chain of Thought components must be used within ChainOfThought");
    }
    return context;
}

// ══════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
}

export function ChainOfThought({
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    children,
    className,
}: ChainOfThoughtProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const open = controlledOpen ?? uncontrolledOpen;
    const handleOpenChange = onOpenChange ?? setUncontrolledOpen;

    return (
        <ChainOfThoughtContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
            <CollapsiblePrimitive.Root
                open={open}
                onOpenChange={handleOpenChange}
                className={cn(
                    "border border-gray-700 bg-gray-800 overflow-hidden transition-all",
                    className
                )}
            >
                {children}
            </CollapsiblePrimitive.Root>
        </ChainOfThoughtContext.Provider>
    );
}

// ══════════════════════════════════════════════════════════
// HEADER (Collapsible Trigger)
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function ChainOfThoughtHeader({ children, className }: ChainOfThoughtHeaderProps) {
    const { open } = useChainOfThought();

    return (
        <CollapsiblePrimitive.Trigger asChild>
            <button
                className={cn(
                    "flex w-full items-center justify-between p-4 hover:bg-gray-700/50 transition-colors text-left",
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    {children}
                </div>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-gray-400 transition-transform duration-200",
                        open && "rotate-180"
                    )}
                />
            </button>
        </CollapsiblePrimitive.Trigger>
    );
}

// ══════════════════════════════════════════════════════════
// CONTENT (Collapsible Content Area)
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtContentProps {
    children: React.ReactNode;
    className?: string;
}

export function ChainOfThoughtContent({ children, className }: ChainOfThoughtContentProps) {
    return (
        <CollapsiblePrimitive.Content
            className={cn(
                "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
                className
            )}
        >
            <div className="p-4 pt-0 space-y-3">
                {children}
            </div>
        </CollapsiblePrimitive.Content>
    );
}

// ══════════════════════════════════════════════════════════
// STEP
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtStepProps {
    icon?: LucideIcon;
    label: string;
    description?: string;
    status: StepStatus;
    children?: React.ReactNode;
    className?: string;
}

export function ChainOfThoughtStep({
    icon: Icon,
    label,
    description,
    status,
    children,
    className,
}: ChainOfThoughtStepProps) {
    const getStatusIcon = () => {
        switch (status) {
            case "complete":
                return <Check className="h-4 w-4 text-green-500" />;
            case "active":
                return <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case "pending":
            default:
                return <div className="h-4 w-4 rounded-full border-2 border-gray-600" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case "complete":
                return "text-green-400";
            case "active":
                return "text-purple-400";
            case "error":
                return "text-red-400";
            case "pending":
            default:
                return "text-gray-500";
        }
    };

    return (
        <div className={cn("flex gap-3", className)}>
            {/* Icon Column */}
            <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 border border-gray-700">
                    {Icon ? <Icon className="h-4 w-4 text-gray-400" /> : getStatusIcon()}
                </div>
                {children && <div className="w-px flex-1 bg-gray-700 mt-2" />}
            </div>

            {/* Content Column */}
            <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                    {!Icon && getStatusIcon()}
                    <h4 className={cn("font-medium text-sm", getStatusColor())}>
                        {label}
                    </h4>
                </div>
                {description && (
                    <p className="text-xs text-gray-400 mb-2">{description}</p>
                )}
                {children}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// SEARCH RESULTS
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtSearchResultsProps {
    children: React.ReactNode;
    className?: string;
}

export function ChainOfThoughtSearchResults({
    children,
    className,
}: ChainOfThoughtSearchResultsProps) {
    return (
        <div className={cn("flex flex-wrap gap-2 mt-2", className)}>
            {children}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// SEARCH RESULT (Badge)
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtSearchResultProps {
    children: React.ReactNode;
    href?: string;
    className?: string;
}

export function ChainOfThoughtSearchResult({
    children,
    href,
    className,
}: ChainOfThoughtSearchResultProps) {
    const Comp = href ? "a" : "span";

    return (
        <Badge
            {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
            variant="secondary"
            className={cn(
                "text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors",
                href && "cursor-pointer",
                className
            )}
            asChild={!!href}
        >
            <Comp>
                {children}
            </Comp>
        </Badge>
    );
}

// ══════════════════════════════════════════════════════════
// IMAGE
// ══════════════════════════════════════════════════════════

interface ChainOfThoughtImageProps {
    src: string;
    alt: string;
    caption?: string;
    className?: string;
}

export function ChainOfThoughtImage({
    src,
    alt,
    caption,
    className,
}: ChainOfThoughtImageProps) {
    return (
        <div className={cn("mt-2", className)}>
            <img
                src={src}
                alt={alt}
                className="w-full rounded border border-gray-700"
            />
            {caption && (
                <p className="text-xs text-gray-500 mt-1 italic">{caption}</p>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// ANIMATIONS (Add to global CSS if not already present)
// ══════════════════════════════════════════════════════════

/*
Add to globals.css:

@keyframes collapsible-down {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--radix-collapsible-content-height);
    opacity: 1;
  }
}

@keyframes collapsible-up {
  from {
    height: var(--radix-collapsible-content-height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}

.animate-collapsible-down {
  animation: collapsible-down 200ms ease-out;
}

.animate-collapsible-up {
  animation: collapsible-up 200ms ease-out;
}
*/
