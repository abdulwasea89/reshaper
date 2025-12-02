"use client";

import { Button } from "@/components/ui/shadcn/button";
import { ThumbsUp, MessageCircle, Repeat2, Send, Heart, MessageSquare, BarChart2, Share, MoreHorizontal, Globe, Calendar, Sparkles } from "lucide-react";

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
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    AI-Generated Posts
                </h1>
                <p className="text-muted-foreground">
                    Your posts are being generated in real-time by AI
                </p>
            </div>

            {/* LinkedIn Post Card */}
            <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                {/* LinkedIn Header */}
                <div className="p-4 flex items-start justify-between">
                    <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">U</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">Your Name</h3>
                                <button className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700">
                                    Subscribe
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">408,360 followers</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                1w • Edited • <Globe className="w-3 h-3" />
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button className="p-2 hover:bg-gray-100 rounded">
                            <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded">
                            <span className="text-2xl text-gray-600">×</span>
                        </button>
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

                {/* LinkedIn Image/Media Area */}
                <div className="bg-linear-to-br from-purple-600 via-purple-500 to-purple-700 h-64 flex items-center justify-center">
                    <div className="text-white text-center space-y-2">
                        <div className="w-16 h-1 bg-white/80 mx-auto rounded-full"></div>
                        <div className="w-12 h-1 bg-white/60 mx-auto rounded-full"></div>
                    </div>
                </div>

                {/* LinkedIn Stats */}
                <div className="px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
                                    <ThumbsUp className="w-3 h-3 text-white" />
                                </div>
                                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                                    <Heart className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <span>1,034</span>
                        </div>
                        <span>15 comments · 17 reposts</span>
                    </div>
                </div>

                {/* LinkedIn Actions */}
                <div className="px-4 py-3 flex items-center justify-around border-b border-gray-200">
                    <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="font-medium">Like</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
                        <Repeat2 className="w-5 h-5" />
                        <span className="font-medium">Repost</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
                        <Send className="w-5 h-5" />
                        <span className="font-medium">Send</span>
                    </button>
                </div>

                {/* LinkedIn Post Actions */}
                <div className="px-4 py-3 flex gap-3">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                    </Button>
                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                        <Send className="w-4 h-4 mr-2" />
                        Post Now
                    </Button>
                </div>
            </div>

            {/* X/Twitter Post Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl max-w-md mx-auto">
                {/* X Header */}
                <div className="p-4 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-sky-500 to-sky-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">U</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <h3 className="font-bold text-gray-900">Your Name</h3>
                            <span className="text-gray-500">@username</span>
                        </div>
                        <div className="mt-2 text-gray-900 text-sm leading-relaxed whitespace-pre-wrap min-h-[80px]">
                            {content.twitterPost || (
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-pulse" />
                                    AI is generating your X post...
                                </span>
                            )}
                        </div>
                        {content.twitterPost && (
                            <p className="text-sky-500 text-sm mt-1">#hashtag</p>
                        )}
                    </div>
                </div>

                {/* X Media Placeholder */}
                {content.twitterPost && (
                    <div className="bg-gray-200 h-48 mx-4 rounded-2xl"></div>
                )}

                {/* X Timestamp */}
                <div className="px-4 py-2">
                    <p className="text-gray-500 text-sm">1:52 PM · Oct 14, 2023 · 200.1K Views</p>
                </div>

                {/* X Stats */}
                <div className="px-4 py-3 border-y border-gray-200">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-900"><strong>931</strong> <span className="text-gray-500">Retweets</span></span>
                        <span className="text-gray-900"><strong>13</strong> <span className="text-gray-500">Quotes</span></span>
                        <span className="text-gray-900"><strong>3,857</strong> <span className="text-gray-500">Likes</span></span>
                        <span className="text-gray-900"><strong>90</strong> <span className="text-gray-500">Bookmarks</span></span>
                    </div>
                </div>

                {/* X Actions */}
                <div className="px-4 py-3 flex items-center justify-around border-b border-gray-200">
                    <button className="text-gray-500 hover:text-sky-500">
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button className="text-gray-500 hover:text-green-500">
                        <Repeat2 className="w-5 h-5" />
                    </button>
                    <button className="text-gray-500 hover:text-pink-500">
                        <Heart className="w-5 h-5" />
                    </button>
                    <button className="text-gray-500 hover:text-sky-500">
                        <BarChart2 className="w-5 h-5" />
                    </button>
                    <button className="text-gray-500 hover:text-sky-500">
                        <Share className="w-5 h-5" />
                    </button>
                </div>

                {/* X Post Actions */}
                <div className="px-4 py-3 flex gap-3">
                    <Button className="flex-1 bg-sky-500 hover:bg-sky-600 text-white">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                    </Button>
                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                        <Send className="w-4 h-4 mr-2" />
                        Post Now
                    </Button>
                </div>
            </div>
        </div>
    );
}
