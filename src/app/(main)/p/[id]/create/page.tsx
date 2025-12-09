import { CreatePostClient } from "../../../dashboard/client";

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

    // return <CreatePostClient params={params} urlParam={urlParam} />;
}
