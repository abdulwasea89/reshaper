"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Inbox,
  Vault,
  Clock,
  FileText,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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

      {/* ONLY THIS LINE CHANGED – fixes the squished mobile layout */}
      <div className="fixed top-4 sm:top-6 left-3 right-3 sm:left-4 sm:right-4 z-50 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto">

        {/* Your 100% original navbar – only added the hamburger */}
        <nav className="relative z-40 flex items-center justify-between gap-4 sm:gap-6 border-white/10 bg-[#121212] px-4 sm:px-6 py-3 border-2">

          {/* Logo + text – now perfectly visible and spaced on mobile */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM5.106 17.834a.75.75 0 001.06 1.06l1.591-1.59a.75.75 0 10-1.06-1.061l-1.591 1.59zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM6.166 5.106a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.061-1.06l-1.59-1.591z" />
              </svg>
            </Link>

          </div>

          {/* Desktop links – untouched */}
          <div className="hidden items-center gap-6 text-sm font-medium text-neutral-400 md:flex">
            <div className="relative cursor-pointer py-2" onMouseEnter={() => setActiveTab("features")}>
              <span className={`transition-colors ${activeTab === "features" ? "text-white" : "hover:text-white"}`}>
                Features
              </span>
            </div>
            {["Pricing", "Updates", "Story", "Download", "Developers"].map((item) => (
              <Link key={item} href="#" onMouseEnter={() => setActiveTab(null)} className="hover:text-white transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <div className="h-4 w-[1px] bg-neutral-700" />
            <Link href={user ? "/dashboard" : "/login"} className="text-sm font-medium text-white hover:text-neutral-300 transition-colors">
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </div>

          {/* ONLY THIS HAMBURGER ADDED */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </nav>

        {/* Your original dropdown – 100% untouched */}
        <AnimatePresence>
          {activeTab === "features" && (
            <motion.div
              initial={{ y: -20, opacity: 0, height: 0 }}
              animate={{ y: 0, opacity: 1, height: "auto" }}
              exit={{ y: -20, opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="absolute left-0 right-0 top-full -mt-[1px] overflow-hidden border-white/10 bg-[#121212] shadow-2xl origin-top"
              onMouseEnter={() => setActiveTab("features")}
              onMouseLeave={() => setActiveTab(null)}
            >
              <div className="flex w-[600px] p-4">
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

        {/* Simple clean mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full   bg-[#121212] md:hidden"
            >
              <div className="p-6 space-y-4">
                {["Features", "Pricing", "Updates", "Story", "Download", "Developers"].map((item) => (
                  <Link key={item} href="#" className="block text-lg text-neutral-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    {item}
                  </Link>
                ))}
                <div className="h-px bg-white/10" />
                <Link href={user ? "/dashboard" : "/login"} className="block text-lg font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>
                  {user ? "Dashboard" : "Sign in"}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}