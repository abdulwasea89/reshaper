import Link from "next/link";

export function Metrics() {
  return (
    <div className="container mx-auto px-4 max-w-[1200px]">
      <div className="grid grid-cols-2 gap-6 md:flex md:flex-wrap md:items-center md:gap-x-12 lg:gap-x-16 xl:gap-x-20 mt-12 md:mt-16 lg:mt-24">
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[10px] md:text-xs mb-1">Businesses</h4>
          <span className="text-lg md:text-xl lg:text-2xl text-white font-medium">20,600+</span>
        </Link>
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[10px] md:text-xs mb-1">Bank accounts</h4>
          <span className="text-lg md:text-xl lg:text-2xl text-white font-medium">6.700+</span>
        </Link>
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[10px] md:text-xs mb-1">Transactions</h4>
          <span className="text-lg md:text-xl lg:text-2xl text-white font-medium">1.7M</span>
        </Link>
        <Link href="/open-startup" className="flex flex-col">
          <h4 className="text-[#878787] text-[10px] md:text-xs mb-1">Transaction value</h4>
          <span className="text-lg md:text-xl lg:text-2xl text-white font-medium">$812M</span>
        </Link>
      </div>
    </div>
  );
}