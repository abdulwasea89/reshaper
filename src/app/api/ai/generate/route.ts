import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { generateContentFromUrl } from "@/lib/ai-agents";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Load and scrape the web page
        const loader = new CheerioWebBaseLoader(url);
        const docs = await loader.load();
        const pageContent = docs[0].pageContent;

        // Use OpenAI Agent to generate content
        const generatedContent = await generateContentFromUrl(
            pageContent.slice(0, 4000) // Limit content to avoid token limits
        );

        return NextResponse.json({
            success: true,
            originalUrl: url,
            ...generatedContent,
        });
    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            {
                error: "Failed to generate content",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
