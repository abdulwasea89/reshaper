"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { Send, Loader2, Sparkles, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { cn } from "@/lib/utils";
import { ToolVisualization, type ToolStatus } from "./tool-indicator";
import { toast } from "sonner";

interface Message {
    role: "user" | "assistant";
    content: string;
    tools?: ToolStatus[];
}

interface AIChatProps {
    currentContent: any;
    onContentUpdate: (newContent: any) => void;
}

export function AIChat({ currentContent, onContentUpdate }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentTools, setCurrentTools] = useState<ToolStatus[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, currentTools]);

    const extractUrl = (text: string): string | null => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        return matches ? matches[0] : null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        const userInput = input;
        setInput("");
        setIsLoading(true);
        setCurrentTools([]);

        // Check if input contains a URL
        const extractedUrl = extractUrl(userInput);

        try {
            if (extractedUrl) {
                // Handle URL-based generation with streaming
                const response = await fetch("/api/ai/generate-stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: extractedUrl }),
                });

                if (!response.ok) throw new Error("Failed to generate content");

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let assistantContent = "";
                const toolsMap = new Map<string, ToolStatus>();

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split("\n");

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6);
                                if (data === "[DONE]") {
                                    setIsLoading(false);
                                    toast.success("✨ Content generated successfully!");
                                    break;
                                }

                                try {
                                    const parsed = JSON.parse(data);

                                    if (parsed.type === "status") {
                                        assistantContent = parsed.message;
                                    } else if (parsed.type === "tool") {
                                        const toolStatus: ToolStatus = {
                                            name: parsed.tool === "web_scraper" ? "Web Scraper" :
                                                parsed.tool === "content_analyzer" ? "Content Analyzer" :
                                                    parsed.tool === "post_generator" ? "Post Generator" : parsed.tool,
                                            status: parsed.status,
                                            message: parsed.message,
                                            icon: parsed.tool === "web_scraper" ? "scraper" :
                                                parsed.tool === "content_analyzer" ? "analyzer" :
                                                    parsed.tool === "post_generator" ? "generator" : undefined,
                                        };
                                        toolsMap.set(parsed.tool, toolStatus);
                                        setCurrentTools(Array.from(toolsMap.values()));
                                    } else if (parsed.type === "complete") {
                                        onContentUpdate({
                                            title: parsed.title || "",
                                            linkedinPost: parsed.linkedinPost || "",
                                            twitterPost: parsed.twitterPost || "",
                                            summary: parsed.summary || "",
                                        });
                                        assistantContent = "✨ I've generated LinkedIn and Twitter posts from the URL!";
                                    } else if (parsed.type === "error") {
                                        throw new Error(parsed.error);
                                    }
                                } catch (e) {
                                    // Skip invalid JSON
                                }
                            }
                        }
                    }
                }

                const assistantMessage: Message = {
                    role: "assistant",
                    content: assistantContent || "✨ Content generated successfully!",
                    tools: Array.from(toolsMap.values()),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setCurrentTools([]);
            } else {
                // Handle regular editing requests (existing functionality)
                const response = await fetch("/api/ai/edit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentContent,
                        editRequest: userInput,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    const { title, linkedinPost, twitterPost, summary } = data;
                    onContentUpdate({ title, linkedinPost, twitterPost, summary });

                    const assistantMessage: Message = {
                        role: "assistant",
                        content: "✨ I've updated your content based on your request!",
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                } else {
                    throw new Error(data.error || "Failed to edit content");
                }
            }
        } catch (error) {
            const errorMessage: Message = {
                role: "assistant",
                content: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setCurrentTools([]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-card">
            {/* Header */}
            <div className="p-4 border-b bg-linear-to-r from-primary/10 to-purple-500/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold">AI Assistant</h3>
                        <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                            <Bot className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-lg">Welcome! Ready to create posts?</h4>
                            <p className="text-sm text-muted-foreground max-w-[250px]">
                                Paste a URL to generate LinkedIn and Twitter posts, or ask me to edit your content
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={() => setInput("Generate posts from https://example.com/article")}
                                className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left"
                            >
                                📎 Paste a URL to generate posts
                            </button>
                            <button
                                onClick={() => setInput("Make it more professional")}
                                className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                ✨ Make it more professional
                            </button>
                            <button
                                onClick={() => setInput("Add emojis")}
                                className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                😊 Add emojis
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx}>
                                <div
                                    className={cn(
                                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                            msg.role === "user"
                                                ? "bg-linear-to-br from-blue-500 to-blue-600"
                                                : "bg-linear-to-br from-primary to-purple-500"
                                        )}
                                    >
                                        {msg.role === "user" ? (
                                            <User className="h-4 w-4 text-white" />
                                        ) : (
                                            <Bot className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-2xl p-3 shadow-sm",
                                            msg.role === "user"
                                                ? "bg-linear-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm"
                                                : "bg-muted rounded-tl-sm"
                                        )}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                                {/* Show tools if available */}
                                {msg.tools && msg.tools.length > 0 && (
                                    <div className="mt-2 ml-11">
                                        <ToolVisualization tools={msg.tools} />
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Show current tools while loading */}
                        {isLoading && currentTools.length > 0 && (
                            <div className="ml-11">
                                <ToolVisualization tools={currentTools} />
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-gradient-to-r from-background/50 to-background">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste a URL or ask me anything..."
                        disabled={isLoading}
                        className="bg-background/50 backdrop-blur-sm border-2 focus-visible:border-primary transition-colors"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="bg-linear-to-br from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transition-all shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}
