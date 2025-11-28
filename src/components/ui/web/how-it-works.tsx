import { HOW_IT_WORKS } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import AnimationContainer from '@/components/global/animation-container';
import Wrapper from "@/components/global/wrapper";
import SectionBadge from "@/components/ui/shadcn/section-badge";

const HowItWorks = () => {
    return (
        <Wrapper className="py-20 lg:py-32 relative">
            <div className="flex flex-col items-center text-center gap-4 py-8 w-full">
                <AnimationContainer animation="fadeUp" delay={0.3}>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-medium !leading-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-neutral-400">
                        Three steps to success
                    </h1>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.4}>
                    <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-lg mx-auto">
                        Our three-step process simplifies real estate transactions and property management.
                    </p>
                </AnimationContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full pt-10">
                
                {HOW_IT_WORKS.map((item, index) => (
                    <AnimationContainer
                        key={index}
                        animation="fadeUp"
                        delay={0.5 + (index * 0.2)}
                    >
                        <div
                            className={cn(
                                "flex flex-col items-start gap-4  p-4 lg:p-8 bg-[#121212] border-2"
                            )}
                        >
                            
                            <div className="flex items-center gap-x-4">
                                <AnimationContainer
                                    animation="scaleUp"
                                    delay={0.7 + (index * 0.2)}
                                >
                                    <div className="size-10  flex items-center justify-center">
                                        <span className="text-lg font-medium text-white">
                                            {index + 1}
                                        </span>
                                    </div>
                                </AnimationContainer>
                                <h3 className="text-lg font-medium">
                                    {item.title}
                                </h3>
                            </div>
                            <div className="space-y-4 w-full">
                                 <AnimationContainer
                                    animation="fadeUp"
                                    delay={0.9 + (index * 0.2)}
                                >
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        width={1024}
                                        height={1024}
                                        className="w-full h-52 object-contain"
                                    />
                                </AnimationContainer>
                                <AnimationContainer
                                    animation="fadeUp"
                                    delay={1.1 + (index * 0.2)}
                                >
                                    <p className="text-sm md:text-base text-muted-foreground">
                                        {item.description}
                                    </p>
                                </AnimationContainer>
                            </div>
                        </div>
                    </AnimationContainer>
                ))}
            </div>
        </Wrapper>
    )
};

export default HowItWorks;
