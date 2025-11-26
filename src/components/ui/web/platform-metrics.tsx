import { METRICS } from '@/constants';
import { cn } from "@/lib/utils";
import NumberFlow from '@number-flow/react';
import Image from "next/image";
import AnimationContainer from '@/components/global/animation-container';
import Wrapper from "@/components/global/wrapper";
import { Button } from '@/components/ui/shadcn/button';
import SectionBadge from '@/components/ui/shadcn/section-badge';

const PlatformMetrics = () => {
    return (
        <Wrapper className="py-20 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
                    <AnimationContainer animation="fadeUp" delay={0.2}>
                        <SectionBadge title="Platform Impact" />
                    </AnimationContainer>

                    <AnimationContainer animation="fadeUp" delay={0.3}>
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-medium !leading-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-neutral-400">
                            Transforming real estate
                            <br />
                            management globally
                        </h2>
                    </AnimationContainer>

                    <AnimationContainer animation="fadeUp" delay={0.4}>
                        <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
                            Join thousands who trust our platform to streamline operations and grow.
                        </p>
                    </AnimationContainer>

                    <AnimationContainer animation="fadeUp" delay={0.5}>
                        <Button className="mt-4">
                            Start your journey
                        </Button>
                    </AnimationContainer>
                </div>

                <div className="flex flex-col gap-6 px-1 md:px-0">
                    {METRICS.map((metric, index) => (
                        <AnimationContainer
                            key={index}
                            animation={metric.reverse ? "fadeLeft" : "fadeRight"}
                            delay={0.6 + (index * 0.2)}
                        >
                            <div className="relative rounded-3xl bg-[#191919] p-4 lg:p-6 overflow-hidden z-0">
                                <AnimationContainer animation="scaleUp" delay={0.7 + (index * 0.2)}>
                                    <div className={cn(
                                        "absolute -bottom-1/2 right-0 bg-primary size-20 lg:size-32 blur-[3rem] lg:blur-[5rem] rounded-full -z-10",
                                        metric.reverse && "left-0"
                                    )}></div>
                                </AnimationContainer>

                                <div className={cn(
                                    "flex items-center justify-between gap-6 z-30",
                                    metric.reverse && "flex-row-reverse"
                                )}>
                                    <AnimationContainer animation="fadeUp" delay={0.8 + (index * 0.2)}>
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-medium">
                                                    <NumberFlow value={metric.number} />
                                                </span>
                                                {metric.suffix && (
                                                    <span className="text-4xl font-medium">
                                                        {metric.suffix}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {metric.label}
                                            </p>
                                        </div>
                                    </AnimationContainer>

                                    <AnimationContainer
                                        animation={metric.reverse ? "fadeRight" : "fadeLeft"}
                                        delay={0.9 + (index * 0.2)}
                                    >
                                        <div className={cn(
                                            "h-32 absolute inset-y-0 my-auto right-0 rounded-2xl flex items-center justify-center",
                                            metric.reverse && "left-0 right-auto"
                                        )}>
                                            <Image
                                                src={metric.image}
                                                alt={metric.label}
                                                width={1024}
                                                height={1024}
                                                className="size-full"
                                            />
                                        </div>
                                    </AnimationContainer>
                                </div>
                            </div>
                        </AnimationContainer>
                    ))}
                </div>
            </div>
        </Wrapper>
    );
};

export default PlatformMetrics; 