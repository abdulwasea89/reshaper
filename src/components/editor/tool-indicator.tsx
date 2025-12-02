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
                return "from-purple-600 to-pink-600";
            default:
                return "from-purple-600 to-pink-600";
        }
    };

    const getStatusIcon = () => {
        switch (tool.status) {
            case "running":
                return <Loader2 className="h-3 w-3 animate-spin text-purple-400" />;
            case "complete":
                return <CheckCircle2 className="h-3 w-3 text-green-400" />;
            case "error":
                return <XCircle className="h-3 w-3 text-red-400" />;
        }
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 transition-all duration-300",
                tool.status === "running" && "border-purple-500/50 animate-pulse",
                tool.status === "complete" && "border-green-500/30",
                tool.status === "error" && "border-red-500/30"
            )}
        >
            <div className={cn(
                "w-8 h-8 flex items-center justify-center bg-gradient-to-br text-white",
                getGradient()
            )}>
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">{tool.name}</span>
                    {getStatusIcon()}
                </div>
                {tool.message && (
                    <p className="text-xs text-gray-400 truncate">{tool.message}</p>
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
        <div className="space-y-2 p-3 bg-gray-900 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">AI Tools</span>
            </div>
            <div className="space-y-2">
                {tools.map((tool, idx) => (
                    <ToolIndicator key={idx} tool={tool} />
                ))}
            </div>
        </div>
    );
}
