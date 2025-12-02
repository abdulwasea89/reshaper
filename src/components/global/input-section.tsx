"use client";

import { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Link2, Loader2, Youtube, FileText } from "lucide-react";
import { motion } from "framer-motion";

export function InputSection() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        try {
            // Create new post with URL
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await response.json();

            // Redirect to the post creation page with URL as query parameter
            window.location.href = `/p/${data.id}/create?url=${encodeURIComponent(url)}`;
        } catch (error) {
            console.error("Error creating post:", error);
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Create New Post</h2>
                <p className="text-muted-foreground">
                    Enter a YouTube video or blog post URL to generate content.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                <div className="relative flex gap-2 bg-background p-2 rounded-xl border shadow-lg">
                    <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Link2 className="size-4" />
                        </div>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste your link here..."
                            className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent h-12 text-lg"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !url}
                        className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                        {isLoading ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            "Generate"
                        )}
                    </Button>
                </div>
            </form>

            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Youtube className="size-4" />
                    <span>YouTube Videos</span>
                </div>
                <div className="flex items-center gap-2">
                    <FileText className="size-4" />
                    <span>Blog Posts</span>
                </div>
            </div>
        </motion.div>
    );
}
