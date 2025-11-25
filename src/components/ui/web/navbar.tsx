"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Inbox,
  Vault,
  Clock,
  FileText
} from "lucide-react";

const featuresList = [
  { id: "overview", title: "Overview", icon: LayoutGrid, description: "See your entire business at a glance." },
  { id: "inbox", title: "Inbox", icon: Inbox, description: "Manage all communications in one place." },
  { id: "vault", title: "Vault", icon: Vault, description: "Secure storage for your financial docs." },
  { id: "tracker", title: "Tracker", icon: Clock, description: "Time tracking built for freelancers." },
  { id: "invoice", title: "Invoice", icon: FileText, description: "Create professional invoices in seconds." },
];

interface NavbarProps {
  user?: { id: string; name: string; email: string; image?: string | null } | null;
}

export function Navbar({ user }: NavbarProps = {}) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState(featuresList[0]);

  return (
    <>
      {/* Background blur */}
      <AnimatePresence>
        {activeTab === "features" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 backdrop-blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div
        className="fixed top-6 inset-x-0 z-50 mx-auto w-full max-w-fit"
        onMouseLeave={() => setActiveTab(null)}
      >
        {/* Your original navbar – 100% unchanged */}
        <nav className="relative z-50 flex items-center justify-between gap-6 border-white/10 bg-[#121212] px-4 py-2.5">
          <Link href="/" className="flex items-center justify-center text-white transition-opacity hover:opacity-80">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM5.106 17.834a.75.75 0 001.06 1.06l1.591-1.59a.75.75 0 10-1.06-1.061l-1.591 1.59zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM6.166 5.106a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.061-1.06l-1.59-1.591z" />
            </svg>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-neutral-400 md:flex">
            <div
              className="relative cursor-pointer py-2"
              onMouseEnter={() => setActiveTab("features")}
            >
              <span className={`transition-colors ${activeTab === "features" ? "text-white" : "hover:text-white"}`}>
                Features
              </span>
            </div>
            {["Pricing", "Updates", "Story", "Download", "Developers"].map((item) => (
              <Link
                key={item}
                href="#"
                onMouseEnter={() => setActiveTab(null)}
                className="hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-4 w-[1px] bg-neutral-700" />
            <Link
              href={user ? "/dashboard" : "/login"}
              className="text-sm font-medium text-white hover:text-neutral-300 transition-colors"
            >
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </nav>

        {/* Dropdown – now slides down beautifully */}
        <AnimatePresence>
          {activeTab === "features" && (
            <motion.div
              initial={{
                y: -20,
                opacity: 0,
                height: 0
              }}
              animate={{
                y: 0,
                opacity: 1,
                height: "auto"
              }}
              exit={{
                y: -20,
                opacity: 0,
                height: 0
              }}
              transition={{
                duration: 0.35,
                ease: [0.32, 0.72, 0, 1] // Super smooth "top-to-bottom" easing
              }}
              className="absolute left-0 right-0 top-full -mt-[1px] overflow-hidden border-white/10 bg-[#121212] shadow-2xl origin-top"
              onMouseEnter={() => setActiveTab("features")}
              onMouseLeave={() => setActiveTab(null)}
            >
              <div className="flex w-[600px] p-4">
                {/* Left Column – unchanged */}
                <div className="flex w-1/3 flex-col gap-1 pr-4">
                  {featuresList.map((feature) => (
                    <button
                      key={feature.id}
                      onMouseEnter={() => setSelectedFeature(feature)}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${selectedFeature.id === feature.id
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                        }`}
                    >
                      <feature.icon className="h-4 w-4" />
                      <span className="font-medium">{feature.title}</span>
                    </button>
                  ))}
                </div>

                {/* Right Column – your exact preview card */}
                <div className="relative flex w-2/3 flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-6">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
                        <selectedFeature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">{selectedFeature.title}</h4>
                      <p className="mt-2 px-4 text-xs text-neutral-400">
                        {selectedFeature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}