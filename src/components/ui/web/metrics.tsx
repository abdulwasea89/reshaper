import Link from "next/link";

export function Metrics() {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-7 md:flex md:flex-wrap md:items-center md:gap-x-8 lg:gap-x-12 xl:gap-x-16 mt-6 sm:mt-8 md:mt-14 lg:mt-20">
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5 sm:mb-1 uppercase tracking-wide">Businesses</h4>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white font-medium">20,600+</span>
        </Link>
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5 sm:mb-1 uppercase tracking-wide">Bank accounts</h4>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white font-medium">6.700+</span>
        </Link>
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5 sm:mb-1 uppercase tracking-wide">Transactions</h4>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white font-medium">1.7M</span>
        </Link>
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5 sm:mb-1 uppercase tracking-wide whitespace-nowrap">Transaction value</h4>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white font-medium">$812M</span>
        </Link>
      </div>
    </div>
  );
}