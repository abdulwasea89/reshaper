// app/page.tsx
import { Navbar } from "@/components/ui/web/navbar";
import {Hero} from "@/components/ui/web/hero";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function HomePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <>
            <Navbar user={session?.user} />
            <Hero /> {/* Now types match perfectly */}
        </>
    );
}