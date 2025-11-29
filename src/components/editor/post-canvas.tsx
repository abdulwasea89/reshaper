"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Save, Download, Sparkles, Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentData {
    title: string;
    linkedinPost: string;
    twitterPost: string;
    summary: string;
}

interface PostCanvasProps {
    content: ContentData;
    onChange: (content: ContentData) => void;
}

export function PostCanvas({ content, onChange }: PostCanvasProps) {
    const [editingField, setEditingField] = useState<keyof ContentData | null>(null);

    const handleFieldChange = (field: keyof ContentData, value: string) => {
        onChange({ ...content, [field]: value });
    };

    const handleSave = async () => {
        console.log("Saving content:", content);
        // TODO: Implement save to database
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(content, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportFileDefaultName = "post-content.json";

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    };

    const getCharacterProgress = (text: string, max: number) => {
        const percentage = (text.length / max) * 100;
        return {
            percentage: Math.min(percentage, 100),
            color: percentage > 100 ? "text-destructive" : percentage > 80 ? "text-warning" : "text-primary",
        };
    };

    return (
        <div className="h-full p-4 md:p-6 space-y-6">
            {/* Header with Actions */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        AI-Generated Post
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Edit your content using AI chat or click to edit directly
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                    <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Title Card */}
            <Card className="group relative overflow-hidden border-2 transition-all hover:shadow-xl hover:border-primary/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle>Post Title</CardTitle>
                    </div>
                    <CardDescription>Maximum 100 characters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input
                        value={content.title}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        placeholder="Enter your post title..."
                        className="text-lg font-semibold bg-background/50 backdrop-blur-sm"
                        maxLength={100}
                    />
                    <div className="flex justify-between text-xs">
                        <span className={cn("font-medium", getCharacterProgress(content.title, 100).color)}>
                            {content.title.length}/100 characters
                        </span>
                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 rounded-full",
                                    getCharacterProgress(content.title, 100).color.replace("text-", "bg-")
                                )}
                                style={{ width: `${getCharacterProgress(content.title, 100).percentage}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Social Media Posts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* LinkedIn Post */}
                <Card className="group relative overflow-hidden border-2 transition-all hover:shadow-xl hover:border-blue-500/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Linkedin className="h-5 w-5 text-blue-600" />
                            <CardTitle>LinkedIn Post</CardTitle>
                        </div>
                        <CardDescription>Professional tone • Max 300 characters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* LinkedIn Preview */}
                        <div className="relative">
                            <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4 space-y-3 min-h-[160px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                        {content.title.charAt(0) || "U"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Your Name</p>
                                        <p className="text-xs text-muted-foreground">Just now</p>
                                    </div>
                                </div>
                                <Textarea
                                    value={content.linkedinPost}
                                    onChange={(e) => handleFieldChange("linkedinPost", e.target.value)}
                                    placeholder="Write your LinkedIn post..."
                                    className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 bg-transparent"
                                    maxLength={300}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className={cn("font-medium", getCharacterProgress(content.linkedinPost, 300).color)}>
                                {content.linkedinPost.length}/300
                            </span>
                            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${getCharacterProgress(content.linkedinPost, 300).percentage}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Twitter Post */}
                <Card className="group relative overflow-hidden border-2 transition-all hover:shadow-xl hover:border-sky-500/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-sky-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Twitter className="h-5 w-5 text-sky-500" />
                            <CardTitle>Twitter/X Post</CardTitle>
                        </div>
                        <CardDescription>Concise & engaging • Max 280 characters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Twitter Preview */}
                        <div className="relative">
                            <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4 space-y-3 min-h-[160px]">
                                <div className="flex items-start gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                        {content.title.charAt(0) || "U"}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <p className="font-semibold text-sm">Your Name</p>
                                            <span className="text-muted-foreground text-xs">@username · now</span>
                                        </div>
                                        <Textarea
                                            value={content.twitterPost}
                                            onChange={(e) => handleFieldChange("twitterPost", e.target.value)}
                                            placeholder="What's happening?"
                                            className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 bg-transparent text-sm"
                                            maxLength={280}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className={cn("font-medium", getCharacterProgress(content.twitterPost, 280).color)}>
                                {content.twitterPost.length}/280
                            </span>
                            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${getCharacterProgress(content.twitterPost, 280).percentage}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Card */}
            <Card className="group relative overflow-hidden border-2 transition-all hover:shadow-xl hover:border-purple-500/50">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <CardTitle>Summary</CardTitle>
                    </div>
                    <CardDescription>Brief overview • Max 200 characters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Textarea
                        value={content.summary}
                        onChange={(e) => handleFieldChange("summary", e.target.value)}
                        placeholder="Enter a brief summary..."
                        className="min-h-[100px] bg-background/50 backdrop-blur-sm resize-none"
                        maxLength={200}
                    />
                    <div className="flex justify-between text-xs">
                        <span className={cn("font-medium", getCharacterProgress(content.summary, 200).color)}>
                            {content.summary.length}/200 characters
                        </span>
                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 rounded-full",
                                    getCharacterProgress(content.summary, 200).color.replace("text-", "bg-")
                                )}
                                style={{ width: `${getCharacterProgress(content.summary, 200).percentage}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
