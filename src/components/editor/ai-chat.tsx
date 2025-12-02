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
                                    break;
                                }

                                try {
                                    const parsed = JSON.parse(data);

                                    if (parsed.type === "status") {
                                        // Use status messages as AI responses
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
                                        // Set a final success message if we don't have one
                                        if (!assistantContent) {
                                            assistantContent = "Great! I've generated LinkedIn and Twitter posts from that URL.";
                                        }
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
                    content: assistantContent || "I've generated your posts successfully!",
                    tools: Array.from(toolsMap.values()),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setCurrentTools([]);
            } else {
                // Handle regular editing requests (existing functionality)
                const response = await fetch("/api/ai/edit-stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentContent,
                        editRequest: userInput,
                    }),
                });

                if (!response.ok) throw new Error("Failed to edit content");

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let assistantContent = "";

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split("\n");

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6);
                                if (data === "[DONE]") break;

                                try {
                                    const parsed = JSON.parse(data);

                                    if (parsed.type === "message") {
                                        // Capture the AI's natural response
                                        assistantContent = parsed.message;
                                    } else if (parsed.type === "complete") {
                                        const { title, linkedinPost, twitterPost, summary } = parsed;
                                        onContentUpdate({ title, linkedinPost, twitterPost, summary });
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
                    content: assistantContent || "I've updated your content!",
                };
                setMessages((prev) => [...prev, assistantMessage]);
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
        <div className="flex flex-col h-screen bg-[#212121]">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">AI Assistant</h3>
                        <p className="text-xs text-gray-400">Powered by Gemini</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                            <Bot className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-lg text-white">Welcome!</h4>
                            <p className="text-sm text-gray-400 max-w-[250px]">
                                Paste a URL to generate posts or ask me to edit your content
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={() => setInput("Generate posts from https://example.com/article")}
                                className="text-xs p-3 bg-gray-800 hover:bg-gray-700 transition-colors text-left text-gray-300 border border-gray-700"
                            >
                                📎 Paste a URL to generate posts
                            </button>
                            <button
                                onClick={() => setInput("Make it more professional")}
                                className="text-xs p-3 bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 border border-gray-700"
                            >
                                ✨ Make it more professional
                            </button>
                            <button
                                onClick={() => setInput("Add emojis")}
                                className="text-xs p-3 bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 border border-gray-700"
                            >
                                😊 Add emojis
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map((msg, idx) => (
                            <div key={idx} className="space-y-3">
                                {/* Message */}
                                <div className={cn(
                                    "flex gap-3",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[80%] px-4 py-3 text-sm leading-relaxed",
                                            msg.role === "user"
                                                ? "bg-gray-700 text-white ml-auto"
                                                : "bg-gray-800 text-gray-200"
                                        )}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Tool Visualization for this message */}
                                {msg.tools && msg.tools.length > 0 && (
                                    <div className="ml-11">
                                        <ToolVisualization tools={msg.tools} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Current tools while loading */}
                        {isLoading && currentTools.length > 0 && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <ToolVisualization tools={currentTools} />
                                </div>
                            </div>
                        )}

                        {/* Loading indicator */}
                        {isLoading && currentTools.length === 0 && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-gray-800 px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask AI anything or paste a URL..."
                        disabled={isLoading}
                        className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-600 focus-visible:border-purple-600"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
