"use client";

import { PRICING_PLANS } from '@/constants';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import AnimationContainer from '@/components/global/animation-container';
import Wrapper from "@/components/global/wrapper";
import { Button } from "@/components/ui/shadcn/button";
import SectionBadge from '@/components/ui/shadcn/section-badge';

const Pricing = () => {

    const [isYearly, setIsYearly] = useState<boolean>(false);

    return (
        <Wrapper className="py-20 lg:py-32">
            <div className="flex flex-col items-center text-center gap-4">
               
                <AnimationContainer animation="fadeUp" delay={0.3}>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-medium !leading-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-neutral-400">
                        Choose your perfect plan
                    </h2>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.4}>
                    <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Select a plan that best suits your real estate business needs
                    </p>
                </AnimationContainer>
            </div>

            <AnimationContainer animation="fadeUp" delay={0.5}>
                <div className="flex items-center justify-center gap-4 pt-10">
                    <button
                        onClick={() => setIsYearly(false)}
                        className={cn(
                            "text-sm font-medium transition-colors",
                            !isYearly ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <div
                        onClick={() => setIsYearly(!isYearly)}
                        className="h-6 w-11 rounded-full bg-[#121212]   p-1 cursor-pointer transition-colors duration-300"
                    >
                        <div
                            className={cn(
                                "h-4 w-4 rounded-full bg-[#9d9999]  transition-transform duration-300",
                                isYearly && "translate-x-5"
                            )}
                        />
                    </div>
                    <button
                        onClick={() => setIsYearly(true)}
                        className={cn(
                            "text-sm font-medium transition-colors",
                            isYearly ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        Yearly
                    </button>
                </div>
            </AnimationContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
                {PRICING_PLANS.map((plan, index) => (
                    <AnimationContainer
                        key={index}
                        animation="fadeUp"
                        delay={0.6 + (index * 0.2)}
                    >
                        <div
                            className={cn(
                                "relative r backdrop-blur-3xl p-8 flex flex-col overflow-hidden",
                                plan.popular && "bg-[#181818]",
                                !plan.popular && "bg-gradient-to-b from-[#181818] to-[#101010]/0"
                            )}
                        >
                            {plan.popular && (
                                <>
                                    <div className="absolute inset-x-0 mx-auto -top-1/8 size-40 rounded-full bg-[#52ff6c] -z-10 blur-[5rem]" />
                                    <div className="absolute top-0 w-4/5 mx-auto inset-x-0 h-px bg-[#52ff6c]-to-r from-primary/0 via-primary to-primary/0"></div>
                                </>
                            )}

                            <AnimationContainer animation="fadeUp" delay={0.7 + (index * 0.2)}>
                                <div className="mb-8">
                                    <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </div>
                            </AnimationContainer>

                            <AnimationContainer animation="fadeUp" delay={0.8 + (index * 0.2)}>
                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-4xl font-medium">$</span>
                                    <span className="text-5xl font-medium">
                                        <NumberFlow
                                            value={isYearly ? plan.price.yearly : plan.price.monthly}
                                        />
                                    </span>
                                    <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                                </div>
                            </AnimationContainer>

                            <div className="flex-1">
                                <AnimationContainer animation="fadeUp" delay={0.9 + (index * 0.2)}>
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center gap-3">
                                                {feature.included ? (
                                                    <Check className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <X className="w-5 h-5 text-muted-foreground" />
                                                )}
                                                <span className={cn(
                                                    "text-sm",
                                                    feature.included ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </AnimationContainer>
                            </div>

                            <AnimationContainer animation="fadeUp" delay={1 + (index * 0.2)}>
                                <Button
                                    variant={plan.popular ? "default" : "secondary"}
                                    className="w-full"
                                >
                                    Get Started
                                </Button>
                            </AnimationContainer>
                            
                        </div>
                    </AnimationContainer>
                ))}
            </div>
        </Wrapper>
    );
};

export default Pricing;
