import { ReactNode } from "react";
import { Command } from "lucide-react";
import { Separator } from "@/components/ui/shadcn/separator";
import { APP_CONFIG } from "@/config/app-config";
import { Button } from "@/components/ui/shadcn/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import React from 'react';

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="h-dvh">
      <div className="grid h-full justify-center p-2 lg:grid-cols-2">
        {/* Left Side (Marketing Panel - White/Light) */}
        <div className="bg-[#21ad67] relative order-2 hidden h-full rounded-3xl lg:flex">
          {/* ... Marketing Content (No Change) ... */}
          <div className="text-primary-foreground absolute top-24 space-y-1 px-10">
            <Command className="size-10" />
            <h1 className="text-2xl font-medium">{APP_CONFIG.name}</h1>
            <p className="text-sm">Design. Build. Launch. Repeat.</p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="text-primary-foreground flex-1 space-y-1">
              <h2 className="font-medium">Ready to launch?</h2>
              <p className="text-sm">Clone the repo, install dependencies, and your dashboard is live in minutes.</p>
            </div>
            <Separator orientation="vertical" className="mx-3 !h-auto" />
            <div className="text-primary-foreground flex-1 space-y-1">
              <h2 className="font-medium">Need help?</h2>
              <p className="text-sm">
                Check out the docs or open an issue on GitHub, community support is just a click away.
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Side (Auth Form - Dark Background) */}
        <div className="relative order-1 flex h-full justify-center items-center">
            
            {/* FIX: Moved the Link inside the content area for better flow and placement. 
                    Used variant="ghost" to ensure it stands out on the dark background. */}
            <Link href="/" className="absolute top-4 mr-72 lg:left-10 z-10">
                <Button size="sm" variant="ghost" className="text-white hover:bg-zinc-800">
                    <ArrowLeftIcon className="size-4 mr-1" />
                </Button>
            </Link>
            
            {children}
        </div>
      </div>
    </main>
  );
}