"use client";

import { useState } from "react";
import { PostCanvas } from "@/components/editor/post-canvas";
import { AIChat } from "@/components/editor/ai-chat";

interface ContentData {
    title: string;
    linkedinPost: string;
    twitterPost: string;
    instagramPost: string;
    threadsPost: string;
    summary: string;
    viralityScores?: {
        linkedin: number;
        twitter: number;
        instagram: number;
        threads: number;
    };
}

export function CreatePostClient({ params, urlParam }: { params: { id: string }; urlParam?: string }) {
    const [content, setContent] = useState<ContentData>({
        title: "",
        linkedinPost: "",
        twitterPost: "",
        instagramPost: "",
        threadsPost: "",
        summary: "",
    });

    // Auto-save to database
    const handleContentChange = async (newContent: ContentData) => {
        setContent(newContent);

        // Auto-save to database
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
        <div className="min-h-screen bg-[#0C0C0C] text-white flex flex-col md:flex-row">
            {/* Post Cards - Left Side on desktop, top on mobile */}
            <div className="flex-1 p-4 md:p-8">
                <PostCanvas content={content} onChange={handleContentChange} />
            </div>

            {/* AI Chat - Right Side on desktop, bottom on mobile - Fixed width on desktop */}
            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-border">
                <AIChat
                    currentContent={content}
                    onContentUpdate={setContent}
                />
            </div>
        </div>
    );
}
