import { ReactNode } from "react";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/shadcn/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/web/sidebar";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/shadcn/button";
import { getPreference } from "@/server/server-actions";
import {
    SIDEBAR_VARIANT_VALUES,
    SIDEBAR_COLLAPSIBLE_VALUES,
    type SidebarVariant,
    type SidebarCollapsible,
} from "@/types/preferences/layout";

import { ThemeSwitcher } from "@/app/(main)/dashboard/_components/sidebar/theme-switcher";
import { AccountSwitcher } from "@/app/(main)/dashboard/_components/sidebar/account-switcher";

export default async function CreatePostLayout({ children }: Readonly<{ children: ReactNode }>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return redirect("/auth/v2/login");
    }

    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

    const [sidebarVariant, sidebarCollapsible] = await Promise.all([
        getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
        getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    ]);

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar variant={sidebarVariant} collapsible={sidebarCollapsible} user={session.user} />
            <SidebarInset className="flex flex-col ">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/50 sticky top-0 z-50 backdrop-blur-md  rounded-t-md">
                    <div className="flex w-full items-center justify-between px-4 lg:px-6">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="h-4" />
                            <h1 className="text-lg font-semibold">Create Post</h1>
                        </div>
                        <div className="flex items-center gap-8">
                            
                                <Button variant="outline" size="sm" className="rounded-md">
                                    Schedule
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-md">
                                    Post
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-md">
                                    History
                                </Button>
                                  <Button variant="outline" size="sm" className="rounded-md">
                                    New Chat
                                </Button>
                            
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
