import { Loader2, CheckCircle2, XCircle, Sparkles, Globe, FileText, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolStatus {
    name: string;
    status: "running" | "complete" | "error";
    message?: string;
    icon?: "scraper" | "analyzer" | "generator";
}

interface ToolIndicatorProps {
    tool: ToolStatus;
}

export function ToolIndicator({ tool }: ToolIndicatorProps) {
    const getIcon = () => {
        switch (tool.icon) {
            case "scraper":
                return <Globe className="h-4 w-4" />;
            case "analyzer":
                return <FileText className="h-4 w-4" />;
            case "generator":
                return <Wand2 className="h-4 w-4" />;
            default:
                return <Sparkles className="h-4 w-4" />;
        }
    };

    const getGradient = () => {
        switch (tool.icon) {
            case "scraper":
                return "from-blue-500 to-cyan-500";
            case "analyzer":
                return "from-purple-500 to-pink-500";
            case "generator":
                return "from-primary to-purple-500";
            default:
                return "from-primary to-purple-500";
        }
    };

    const getStatusIcon = () => {
        switch (tool.status) {
            case "running":
                return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
            case "complete":
                return <CheckCircle2 className="h-3 w-3 text-green-500" />;
            case "error":
                return <XCircle className="h-3 w-3 text-destructive" />;
        }
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
                tool.status === "running" && "bg-linear-to-r from-primary/10 to-purple-500/10 border-primary/50 animate-pulse",
                tool.status === "complete" && "bg-green-500/10 border-green-500/30",
                tool.status === "error" && "bg-destructive/10 border-destructive/30"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center bg-linear-to-br text-white",
                getGradient()
            )}>
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tool.name}</span>
                    {getStatusIcon()}
                </div>
                {tool.message && (
                    <p className="text-xs text-muted-foreground truncate">{tool.message}</p>
                )}
            </div>
        </div>
    );
}

interface ToolVisualizationProps {
    tools: ToolStatus[];
}

export function ToolVisualization({ tools }: ToolVisualizationProps) {
    if (tools.length === 0) return null;

    return (
        <div className="space-y-2 p-3 bg-muted/20 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">AI Tools</span>
            </div>
            <div className="space-y-2">
                {tools.map((tool, idx) => (
                    <ToolIndicator key={idx} tool={tool} />
                ))}
            </div>
        </div>
    );
}
