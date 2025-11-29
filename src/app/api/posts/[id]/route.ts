import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, linkedinPost, twitterPost, summary } = await request.json();

        // Update post in database
        const post = await prisma.post.update({
            where: {
                id: params.id,
                userId: session.user.id, // Ensure user owns the post
            },
            data: {
                title,
                content: JSON.stringify({ linkedinPost, twitterPost, summary }),
            },
        });

        return NextResponse.json({ success: true, post });
    } catch (error) {
        console.error("Error updating post:", error);
        return NextResponse.json(
            { error: "Failed to update post" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const post = await prisma.post.findUnique({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, post });
    } catch (error) {
        console.error("Error fetching post:", error);
        return NextResponse.json(
            { error: "Failed to fetch post" },
            { status: 500 }
        );
    }
}
