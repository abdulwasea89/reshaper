"use client";

import { useState } from "react";
import { PostCanvas } from "@/components/editor/post-canvas";
import { AIChat } from "@/components/editor/ai-chat";

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
        <div className="min-h-screen bg-[#0C0C0C] text-white flex">
            {/* Post Cards - Left Side - Takes remaining space */}
            <div className="flex-1 p-8">
                <PostCanvas content={content} onChange={handleContentChange} />
            </div>

            {/* AI Chat - Right Side - Fixed width, no margins, sticky to left edge */}
            <div className="w-96 border-l border-border">
                <AIChat
                    currentContent={content}
                    onContentUpdate={setContent}
                />
            </div>
        </div>
    );
}
