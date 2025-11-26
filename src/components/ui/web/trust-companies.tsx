import  MaxWidthWrapper  from "@/components/ui/web/max-width-wrapper";
import  AnimationContainer  from "@/components/ui/web/animation-container";

import { COMPANIES } from "@/../utils/constants";
import Image from "next/image";

export default async function Companies() {
    return (
        <MaxWidthWrapper>
            <AnimationContainer delay={0.4}>
                <div className="py-14">
                    <div className="mx-auto px-4 md:px-8">
                        <h2 className="text-center text-sm font-medium font-heading text-neutral-400 uppercase">
What Our Clients Says                        </h2>
                        <div className="mt-8">
                            <ul className="flex flex-wrap items-center gap-x-6 gap-y-6 md:gap-x-16 justify-center">
                                {COMPANIES.map((company) => (
                                    <li key={company.name}>
                                        <Image
                                            src={company.logo}
                                            alt={company.name}
                                            width={80}
                                            height={80}
                                            quality={100}
                                            className="w-28 h-auto"
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </AnimationContainer>
        </MaxWidthWrapper>


    )
}