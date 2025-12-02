"use client";

import { useState, useEffect } from "react";
import { PostCanvas } from "@/components/editor/post-canvas";
import { AIChat } from "@/components/editor/ai-chat";
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2, Link as LinkIcon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { toast } from "sonner";

interface ContentData {
    title: string;
    linkedinPost: string;
    twitterPost: string;
    summary: string;
}

export default async function CreatePost({
    params,
    searchParams
}: {
    params: { id: string };
    searchParams: Promise<{ url?: string }>
}) {
    // Await searchParams in Next.js 15
    const resolvedSearchParams = await searchParams;
    const urlParam = resolvedSearchParams.url;

    return <CreatePostClient params={params} urlParam={urlParam} />;
}

function CreatePostClient({ params, urlParam }: { params: { id: string }; urlParam?: string }) {
    const [content, setContent] = useState<ContentData>({
        title: "",
        linkedinPost: "",
        twitterPost: "",
        summary: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [url, setUrl] = useState("");
    const [hasGenerated, setHasGenerated] = useState(false);
    const [streamingSteps, setStreamingSteps] = useState<Array<{ thought: string; action: string; observation: string }>>([]);
    const [currentStatus, setCurrentStatus] = useState("");

    // Extract URL from query params and auto-start generation
    useEffect(() => {
        if (urlParam && !hasGenerated && !isLoading) {
            setUrl(urlParam);
            // Auto-start generation
            handleGenerateFromUrlStreaming(urlParam);
        }
    }, [urlParam]);

    const handleGenerateFromUrl = async () => {
        if (!url.trim()) {
            toast.error("Please enter a URL");
            return;
        }

        try {
            new URL(url); // Validate URL format
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (data.success) {
                setContent({
                    title: data.title || "",
                    linkedinPost: data.linkedinPost || "",
                    twitterPost: data.twitterPost || "",
                    summary: data.summary || "",
                });
                setHasGenerated(true);
                toast.success("✨ Content generated successfully!");
            } else {
                throw new Error(data.error || "Failed to generate content");
            }
        } catch (error) {
            console.error("Error generating content:", error);
            toast.error(error instanceof Error ? error.message : "Failed to generate content");
        } finally {
            setIsLoading(false);
        }
    };

    // Streaming generation with ReAct agent
    const handleGenerateFromUrlStreaming = async (urlToUse: string) => {
        const targetUrl = urlToUse || url;
        if (!targetUrl.trim()) {
            toast.error("Please enter a URL");
            return;
        }

        try {
            new URL(targetUrl); // Validate URL format
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsLoading(true);
        setStreamingSteps([]);
        setCurrentStatus("Initializing AI agent...");

        try {
            const response = await fetch("/api/ai/generate-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: targetUrl }),
            });

            if (!response.ok) {
                throw new Error("Failed to start generation");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No response body");
            }

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
                            setHasGenerated(true);
                            toast.success("✨ Content generated successfully!");
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.type === "status") {
                                setCurrentStatus(parsed.message);
                            } else if (parsed.type === "step") {
                                setStreamingSteps(prev => [...prev, parsed]);
                                setCurrentStatus(`${parsed.action}...`);
                            } else if (parsed.type === "complete") {
                                setContent({
                                    title: parsed.title || "",
                                    linkedinPost: parsed.linkedinPost || "",
                                    twitterPost: parsed.twitterPost || "",
                                    summary: parsed.summary || "",
                                });
                            } else if (parsed.type === "error") {
                                throw new Error(parsed.error);
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error generating content:", error);
            toast.error(error instanceof Error ? error.message : "Failed to generate content");
            setIsLoading(false);
        }
    };

    // Auto-save to database
    const handleContentChange = async (newContent: ContentData) => {
        setContent(newContent);

        // TODO: Implement auto-save to database
        try {
            await fetch(`/api/posts/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newContent),
            });
        } catch (error) {
            console.error("Error saving content:", error);
        }
    };


    return (
        <div className="h-full">
            {!hasGenerated ? (
                // URL Input Section - shown before content generation
                <div className="flex items-center justify-center min-h-[600px] p-6">
                    <div className="w-full max-w-2xl space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                <div className="min-h-screen bg-[#0C0C0C] text-white">
                                    <div className="container mx-auto px-4 py-8">
                                        {!hasGenerated ? (
                                            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
                                                <div className="w-full max-w-2xl">
                                                    {/* URL Input Section */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <LinkIcon className="h-5 w-5 text-primary" />
                                                            <h2 className="text-xl font-semibold">Enter URL to Generate Posts</h2>
                                                        </div>        <Input
                                                            value={url}
                                                            onChange={(e) => setUrl(e.target.value)}
                                                            placeholder="https://example.com/article"
                                                            className="pl-10 h-12 text-lg bg-background/50 backdrop-blur-sm border-2"
                                                            disabled={isLoading}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handleGenerateFromUrl();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleGenerateFromUrl}
                                                        disabled={isLoading || !url.trim()}
                                                        size="lg"
                                                        className="h-12 px-8 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="h-4 w-4 mr-2" />
                                                                Generate
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                                        <div className="text-2xl font-bold text-primary">1</div>
                                                        <div className="text-sm text-muted-foreground">Enter URL</div>
                                                    </div>
                                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                                        <div className="text-2xl font-bold text-primary">2</div>
                                                        <div className="text-sm text-muted-foreground">AI Extracts Content</div>
                                                    </div>
                                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                                        <div className="text-2xl font-bold text-primary">3</div>
                                                        <div className="text-sm text-muted-foreground">Posts Generated</div>
                                                    </div>
                                                </div>
                                            </div>
                    </div>
                                </div>
                                ) : (
                                // Editor Section - shown after content is generated
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                                    {/* Canvas Editor - 2/3 width on large screens */}
                                    <div className="xl:col-span-2 flex flex-col min-h-[600px]">
                                        <PostCanvas content={content} onChange={handleContentChange} />
                                    </div>

                                    {/* AI Chat - 1/3 width on large screens */}
                                    <div className="xl:col-span-1 min-h-[600px]">
                                        <AIChat currentContent={content} onContentUpdate={setContent} />
                                    </div>
                                </div>
            )}
                            </div>
                            );
}
