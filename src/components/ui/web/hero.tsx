import { Button } from "@/../packages/ui/src/components/button";
import Link from "next/link";
import { HeroImage } from "./hero-image";
import { ArrowRight } from "lucide-react"; // Assuming you have lucide-react or similar for icons

export function Hero() {
  return (
    <section className="pt-32 sm:pt-40 md:pt-48 lg:pt-[150px] min-h-screen overflow-hidden">
      <div className="flex flex-col container mx-auto px-4 sm:px-6 md:px-8 lg:px-4 max-w-[1200px]">
        
        {/* 1. The Top "Pill" Badge */}
        <Link href="/updates/midday-v1-1" className="w-fit mb-6 sm:mb-8">
          <div className="
            rounded-full border border-[#2C2C2C] bg-[#1A1A1A]/50 
            flex space-x-2 items-center px-4 py-1.5 
            hover:bg-[#2C2C2C] transition-colors duration-200 cursor-pointer
          ">
            <span className="text-[11px] md:text-xs font-medium text-white">Reshaper </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={12}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#878787]"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* 2. The Headline */}
        <h1 className="
          max-w-full sm:max-w-[700px] md:max-w-[800px] 
          text-[#878787] 
          text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] 
          leading-[1.2] sm:leading-[1.15] 
          font-serif tracking-tight
        ">
            Your AI Assistant that create posts with Blog posts, YT Videos {" "}
          <span className="text-white">that saves you hours every week</span>.
        </h1>

        {/* 3. Button & Trial Text */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          <div className="flex flex-col items-start gap-4">
            <a href="https://app.midday.ai">
              <Button className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 text-sm font-medium bg-white text-black hover:bg-gray-200">
                Meet your assistant
              </Button>
            </a>
            <p className="text-[10px] sm:text-xs text-[#707070] font-mono">
              3 day trial (No credit card required)
            </p>
          </div>
        </div>

        {/* 4. The Hero Image (Dashboard) */}
        {/* We moved this inside the container and added margin-top to separate it from the text */}
        
           {/* Assuming HeroImage contains the dashboard screenshot */}
           {/* <HeroImage /> */}

      </div>
    </section>
  );
}