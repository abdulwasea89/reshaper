"use client";

import { useState, useEffect } from "react";
import { PostCanvas } from "@/components/editor/post-canvas";
import { AIChat } from "@/components/editor/ai-chat";
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2 } from "lucide-react";

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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                {/* Canvas Editor - 2/3 width on large screens */}
                <div className="xl:col-span-2 flex flex-col min-h-[600px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <PostCanvas content={content} onChange={handleContentChange} />
                    )}
                </div>

                {/* AI Chat - 1/3 width on large screens */}
                <div className="xl:col-span-1 min-h-[600px]">
                    <AIChat currentContent={content} onContentUpdate={setContent} />
                </div>
            </div>
        </div>
    );
}
