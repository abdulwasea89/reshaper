"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { Send, Loader2, Sparkles, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AIChatProps {
    currentContent: any;
    onContentUpdate: (newContent: any) => void;
}

export function AIChat({ currentContent, onContentUpdate }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentContent,
                    editRequest: input,
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
        } catch (error) {
            const errorMessage: Message = {
                role: "assistant",
                content: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full border-2 rounded-xl bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
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
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                            <Bot className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-lg">Ready to help!</h4>
                            <p className="text-sm text-muted-foreground max-w-[200px]">
                                Ask me to edit your content, change the tone, or make it more engaging
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={() => setInput("Make it more professional")}
                                className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Make it more professional
                            </button>
                            <button
                                onClick={() => setInput("Add emojis")}
                                className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Add emojis ✨
                            </button>
                            <button
                                onClick={() => setInput("Make it shorter")}
                                className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Make it shorter
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                            : "bg-gradient-to-br from-primary to-purple-500"
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
                                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm"
                                            : "bg-muted rounded-tl-sm"
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
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
                        placeholder="Ask AI to edit content..."
                        disabled={isLoading}
                        className="bg-background/50 backdrop-blur-sm border-2 focus-visible:border-primary transition-colors"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-br from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transition-all shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}
