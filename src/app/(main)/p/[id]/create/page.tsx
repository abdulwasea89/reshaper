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

export default function CreatePost({ params }: { params: { id: string } }) {
    const [content, setContent] = useState<ContentData>({
        title: "",
        linkedinPost: "",
        twitterPost: "",
        summary: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [url, setUrl] = useState("");
    const [hasGenerated, setHasGenerated] = useState(false);

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
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                Generate AI-Powered Posts
                            </h2>
                            <p className="text-muted-foreground">
                                Enter a URL and let AI extract content to create engaging social media posts
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
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
