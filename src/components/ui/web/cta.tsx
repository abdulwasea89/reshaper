import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AnimationContainer from "@/components/global/animation-container";
import Wrapper from "@/components/global/wrapper";
import { Button } from "@/components/ui/shadcn/button";
import { FlickeringGrid } from "@/components/ui/shadcn/flickering-grid";
import SectionBadge from "@/components/ui/shadcn/section-badge";

const CTA = () => {
    return (
        <Wrapper className="py-20 lg:py-32">
            <div className="flex flex-col items-center text-center relative gap-4 py-20 lg:py-32 overflow-hidden z-0">
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101010] w-full h-1/2 z-10"></div>

                <AnimationContainer animation="scaleUp" delay={0.2} className="w-full mx-auto">
                    <div className="absolute -top-1/2 inset-x-0 mx-auto bg-foreground/50 rounded-full size-1/2 blur-[4rem] lg:blur-[10rem]"></div>
                </AnimationContainer>

                <AnimationContainer animation="scaleUp" delay={0.3}>
                    <div className="absolute top-0 w-4/5 mx-auto inset-x-0 h-px bg-gradient-to-r from-foreground/0 via-foreground/50 to-foreground/0"></div>
                </AnimationContainer>

                <AnimationContainer animation="scaleUp" delay={0.2}>
                    <FlickeringGrid
                        className="absolute inset-0 -z-10 h-full w-[120%]"
                        squareSize={4}
                        gridGap={6}
                        color="#525252"
                        maxOpacity={0.2}
                        flickerChance={0.1}
                        height={800}
                    />
                </AnimationContainer>

                <div className="flex flex-col items-center justify-center w-full z-30">

                    <AnimationContainer animation="fadeUp" delay={0.4}>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium !leading-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-neutral-400">
                            Ready to get started?
                        </h2>
                    </AnimationContainer>

                    <AnimationContainer animation="fadeUp" delay={0.5}>
                        <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-lg mx-auto mt-4">
                            Sign up for a free trial and see how PropEase can help you manage your properties.
                        </p>
                    </AnimationContainer>



                    <AnimationContainer animation="fadeUp" delay={1}>
                        <Link href="/signin">
                            <Button size="lg" className="mt-6">
                                Start now
                                <ArrowRightIcon className="size-4 ml-2" />
                            </Button>
                        </Link>
                    </AnimationContainer>
                </div>
            </div>
        </Wrapper>
    )
};

export default CTA;
