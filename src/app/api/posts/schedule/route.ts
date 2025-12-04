import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// GET - List scheduled posts
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // pending, published, failed
        const platform = searchParams.get('platform');

        const where: Record<string, unknown> = {
            postVersion: {
                post: {
                    userId: session.user.id,
                },
            },
        };

        if (status) {
            where.status = status;
        }
        if (platform) {
            where.platform = platform;
        }

        const scheduledPosts = await prisma.scheduledPost.findMany({
            where,
            include: {
                postVersion: {
                    include: {
                        post: {
                            select: {
                                id: true,
                                title: true,
                                source: {
                                    select: {
                                        type: true,
                                        originalUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { scheduledFor: 'asc' },
        });

        return NextResponse.json({
            success: true,
            scheduledPosts,
        });
    } catch (error) {
        console.error("Error fetching scheduled posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch scheduled posts" },
            { status: 500 }
        );
    }
}

// POST - Schedule a post
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { postVersionId, platform, scheduledFor } = body;

        if (!postVersionId || !platform || !scheduledFor) {
            return NextResponse.json(
                { error: "postVersionId, platform, and scheduledFor are required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const postVersion = await prisma.postVersion.findUnique({
            where: { id: postVersionId },
            include: {
                post: {
                    select: { userId: true },
                },
            },
        });

        if (!postVersion || postVersion.post.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Post version not found or unauthorized" },
                { status: 404 }
            );
        }

        // Validate scheduled time is in the future
        const scheduledDate = new Date(scheduledFor);
        if (scheduledDate <= new Date()) {
            return NextResponse.json(
                { error: "Scheduled time must be in the future" },
                { status: 400 }
            );
        }

        const scheduledPost = await prisma.scheduledPost.create({
            data: {
                postVersionId,
                platform,
                scheduledFor: scheduledDate,
                status: 'pending',
            },
        });

        return NextResponse.json({
            success: true,
            scheduledPost,
        });
    } catch (error) {
        console.error("Error scheduling post:", error);
        return NextResponse.json(
            { error: "Failed to schedule post" },
            { status: 500 }
        );
    }
}

// PUT - Update scheduled post (reschedule or cancel)
export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, scheduledFor, status } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Scheduled post ID is required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.scheduledPost.findUnique({
            where: { id },
            include: {
                postVersion: {
                    include: {
                        post: {
                            select: { userId: true },
                        },
                    },
                },
            },
        });

        if (!existing || existing.postVersion.post.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Scheduled post not found or unauthorized" },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};

        if (scheduledFor) {
            const scheduledDate = new Date(scheduledFor);
            if (scheduledDate <= new Date()) {
                return NextResponse.json(
                    { error: "Scheduled time must be in the future" },
                    { status: 400 }
                );
            }
            updateData.scheduledFor = scheduledDate;
        }

        if (status) {
            if (!['pending', 'cancelled'].includes(status)) {
                return NextResponse.json(
                    { error: "Invalid status. Use: pending or cancelled" },
                    { status: 400 }
                );
            }
            updateData.status = status;
        }

        const scheduledPost = await prisma.scheduledPost.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            scheduledPost,
        });
    } catch (error) {
        console.error("Error updating scheduled post:", error);
        return NextResponse.json(
            { error: "Failed to update scheduled post" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a scheduled post
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: "Scheduled post ID is required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.scheduledPost.findUnique({
            where: { id },
            include: {
                postVersion: {
                    include: {
                        post: {
                            select: { userId: true },
                        },
                    },
                },
            },
        });

        if (!existing || existing.postVersion.post.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Scheduled post not found or unauthorized" },
                { status: 404 }
            );
        }

        await prisma.scheduledPost.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Scheduled post deleted",
        });
    } catch (error) {
        console.error("Error deleting scheduled post:", error);
        return NextResponse.json(
            { error: "Failed to delete scheduled post" },
            { status: 500 }
        );
    }
}
