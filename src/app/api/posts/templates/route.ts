import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// GET - List all templates for the user
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const templates = await prisma.template.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            templates,
        });
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json(
            { error: "Failed to fetch templates" },
            { status: 500 }
        );
    }
}

// POST - Create a new template
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, style, promptTemplate, exampleOutput, platforms = ['x', 'linkedin'] } = body;

        if (!name || !style || !promptTemplate) {
            return NextResponse.json(
                { error: "Name, style, and promptTemplate are required" },
                { status: 400 }
            );
        }

        const template = await prisma.template.create({
            data: {
                name,
                description,
                style,
                promptTemplate,
                exampleOutput,
                platforms,
                userId: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            template,
        });
    } catch (error) {
        console.error("Error creating template:", error);
        return NextResponse.json(
            { error: "Failed to create template" },
            { status: 500 }
        );
    }
}

// PUT - Update a template
export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Template ID is required" },
                { status: 400 }
            );
        }

        // Check ownership
        const existing = await prisma.template.findUnique({
            where: { id },
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Template not found or unauthorized" },
                { status: 404 }
            );
        }

        const template = await prisma.template.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            template,
        });
    } catch (error) {
        console.error("Error updating template:", error);
        return NextResponse.json(
            { error: "Failed to update template" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a template
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
                { error: "Template ID is required" },
                { status: 400 }
            );
        }

        // Check ownership
        const existing = await prisma.template.findUnique({
            where: { id },
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Template not found or unauthorized" },
                { status: 404 }
            );
        }

        await prisma.template.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Template deleted",
        });
    } catch (error) {
        console.error("Error deleting template:", error);
        return NextResponse.json(
            { error: "Failed to delete template" },
            { status: 500 }
        );
    }
}
