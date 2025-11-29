import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Create new post with unique ID
        const post = await prisma.post.create({
            data: {
                userId: session.user.id,
                title: null,
                content: null,
                originalLink: null,
            },
        });

        return NextResponse.json({ id: post.id }, { status: 201 });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
