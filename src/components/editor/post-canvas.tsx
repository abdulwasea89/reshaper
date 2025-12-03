"use client";

import { Button } from "@/components/ui/shadcn/button";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { Badge } from "@/components/ui/shadcn/badge";
import {
    ThumbsUp, MessageCircle, Repeat2, Send, Heart, MessageSquare,
    BarChart2, Share, MoreHorizontal, Globe, Calendar, Sparkles,
    Instagram, AtSign, Zap
} from "lucide-react";

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

interface PostCanvasProps {
    content: ContentData;
    onChange: (content: ContentData) => void;
}

function ViralityBadge({ score }: { score?: number }) {
    if (score === undefined) return null;

    let color = "bg-gray-500";
    if (score >= 80) color = "bg-green-500";
    else if (score >= 60) color = "bg-yellow-500";
    else if (score > 0) color = "bg-orange-500";

    return (
        <Badge className={`${color} text-white hover:${color} absolute top-4 right-4 z-10 shadow-md`}>
            <Zap className="w-3 h-3 mr-1 fill-current" />
            {score}/100 Virality
        </Badge>
    );
}

export function PostCanvas({ content, onChange }: PostCanvasProps) {
    return (
        <ScrollArea className="h-screen">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-white">
                        AI-Generated Posts
                    </h1>
                    <p className="text-gray-400">
                        Multi-platform content optimized for engagement
                    </p>
                </div>

                {/* LinkedIn Post Card */}
                <div className="bg-white overflow-hidden shadow-lg rounded-lg relative group">
                    <ViralityBadge score={content.viralityScores?.linkedin} />

                    {/* LinkedIn Header */}
                    <div className="p-4 flex items-start justify-between">
                        <div className="flex gap-3">
                            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center rounded-full">
                                <span className="text-white font-bold text-lg">U</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Your Name</h3>
                                    <span className="text-gray-500 text-sm">• 1st</span>
                                </div>
                                <p className="text-sm text-gray-600">Content Creator | AI Enthusiast</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    1h • <Globe className="w-3 h-3" />
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>

                    {/* LinkedIn Content */}
                    <div className="px-4 pb-3">
                        <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                            {content.linkedinPost || (
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-pulse" />
                                    AI is generating your LinkedIn post...
                                </span>
                            )}
                        </div>
                    </div>

                    {/* LinkedIn Actions */}
                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                        <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded">
                            <ThumbsUp className="w-5 h-5" />
                            <span className="font-medium text-sm">Like</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium text-sm">Comment</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded">
                            <Repeat2 className="w-5 h-5" />
                            <span className="font-medium text-sm">Repost</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded">
                            <Send className="w-5 h-5" />
                            <span className="font-medium text-sm">Send</span>
                        </button>
                    </div>
                </div>

                {/* X/Twitter Post Card */}
                <div className="bg-black border border-gray-800 overflow-hidden shadow-lg rounded-lg max-w-xl mx-auto relative group">
                    <ViralityBadge score={content.viralityScores?.twitter} />

                    {/* X Header */}
                    <div className="p-4 flex items-start gap-3">
                        <div className="w-10 h-10 bg-sky-500 flex items-center justify-center rounded-full shrink-0">
                            <span className="text-white font-bold">U</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <h3 className="font-bold text-white">Your Name</h3>
                                <span className="text-gray-500">@username</span>
                                <span className="text-gray-500">· 1h</span>
                            </div>
                            <div className="mt-1 text-white text-[15px] leading-relaxed whitespace-pre-wrap min-h-[60px]">
                                {content.twitterPost || (
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 animate-pulse" />
                                        AI is generating your X post...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* X Actions */}
                    <div className="px-16 py-3 flex items-center justify-between border-t border-gray-800">
                        <button className="text-gray-500 hover:text-sky-500 group flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs">12</span>
                        </button>
                        <button className="text-gray-500 hover:text-green-500 group flex items-center gap-1">
                            <Repeat2 className="w-4 h-4" />
                            <span className="text-xs">5</span>
                        </button>
                        <button className="text-gray-500 hover:text-pink-500 group flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span className="text-xs">48</span>
                        </button>
                        <button className="text-gray-500 hover:text-sky-500 group flex items-center gap-1">
                            <BarChart2 className="w-4 h-4" />
                            <span className="text-xs">1.2k</span>
                        </button>
                    </div>
                </div>

                {/* Instagram Post Card */}
                <div className="bg-white overflow-hidden shadow-lg rounded-lg max-w-md mx-auto relative group">
                    <ViralityBadge score={content.viralityScores?.instagram} />

                    {/* Instagram Header */}
                    <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px] rounded-full">
                                <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                                    <div className="w-full h-full bg-gray-200"></div>
                                </div>
                            </div>
                            <span className="font-semibold text-sm text-gray-900">your_username</span>
                        </div>
                        <MoreHorizontal className="w-5 h-5 text-gray-900" />
                    </div>

                    {/* Instagram Image Placeholder */}
                    <div className="bg-gray-100 aspect-square flex items-center justify-center">
                        <Instagram className="w-12 h-12 text-gray-300" />
                    </div>

                    {/* Instagram Content */}
                    <div className="p-3 space-y-2">
                        <div className="flex justify-between">
                            <div className="flex gap-4">
                                <Heart className="w-6 h-6 text-gray-900" />
                                <MessageCircle className="w-6 h-6 text-gray-900" />
                                <Send className="w-6 h-6 text-gray-900" />
                            </div>
                            <div className="text-gray-900">
                                <svg aria-label="Save" className="x1lliihq x1n2onr6" color="rgb(38, 38, 38)" fill="rgb(38, 38, 38)" height="24" role="img" viewBox="0 0 24 24" width="24"><polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">1,234 likes</div>
                        <div className="text-sm text-gray-900">
                            <span className="font-semibold mr-2">your_username</span>
                            <span className="whitespace-pre-wrap">
                                {content.instagramPost || (
                                    <span className="text-gray-400">
                                        AI is generating your Instagram caption...
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Threads Post Card */}
                <div className="bg-white overflow-hidden shadow-lg rounded-lg max-w-xl mx-auto relative group">
                    <ViralityBadge score={content.viralityScores?.threads} />

                    <div className="p-4 flex gap-3">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-xs">U</span>
                            </div>
                            <div className="w-0.5 flex-1 bg-gray-200 my-1 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-black text-sm">your_username</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400 text-sm">2h</span>
                                    <MoreHorizontal className="w-5 h-5 text-gray-900" />
                                </div>
                            </div>
                            <div className="mt-1 text-black text-[15px] leading-relaxed whitespace-pre-wrap">
                                {content.threadsPost || (
                                    <span className="text-gray-400 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 animate-pulse" />
                                        Generating Threads post...
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-4 mt-3">
                                <Heart className="w-5 h-5 text-gray-900" />
                                <MessageCircle className="w-5 h-5 text-gray-900" />
                                <Repeat2 className="w-5 h-5 text-gray-900" />
                                <Send className="w-5 h-5 text-gray-900" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </ScrollArea>
    );
}
