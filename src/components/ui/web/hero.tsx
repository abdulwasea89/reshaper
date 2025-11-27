import Image from "next/image";
import Link from "next/link";
import AnimationContainer from "@/../src/components/global/animation-container";
import Images from "@/../src/components/global/images";
import Wrapper from "@/components/global/wrapper";
import { Button } from "@/../packages/ui/src/components/button";
import { Marquee } from "@/components/ui/marquee";

const Hero = () => {

    const companies = [
        Images.comp1,
        Images.comp2,
        Images.comp3,
        Images.comp4,
        Images.comp5,
        Images.comp6,
    ];

    return (
        <Wrapper className="pt-28 relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

            <div className="flex flex-col items-center text-center max-w-6xl w-full px-4 gap-6">
 <div className="absolute inset-x-0 mx-auto mt-40 mr-44 -top-1/8 size-40 rounded-full bg-[#52ff6c] -z-10 blur-[5rem]" />
                                    <div className="absolute top-0 w-4/5 mx-auto inset-x-0 h-px bg-[#52ff6c]-to-r from-primary/0 via-primary to-primary/0"></div>
                <AnimationContainer animation="fadeUp" delay={0.4}>
                    <h1 className="text-5xl lg:text-7xl  leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-300">
                        10x Your Content Output.
                        <br />
                        Zero Extra Effort.
                    </h1>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.6}>
                    <p className="text-md lg:text-lg text-muted-foreground text-xs max-w-2xl mx-auto">
                        Stop writing from scratch. Turn a single blog post, video transcript, or messy note into a week’s worth of content instantly.
                    </p>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.75}>
                    <Link href={"/dashboard"}>
                    <Button className="px-7 py-5 text-lg">
                        Start free trial
                    </Button>
                    </Link>
                </AnimationContainer>

                <AnimationContainer animation="fadeUp" delay={0.9}>
                    <div className="w-full max-w-4xl mt-6">
                        <Marquee className="[--duration:35s] select-none [--gap:3rem]">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="flex items-center justify-center h-16 opacity-70">
                                    {companies[i % companies.length]({ className: "h-6 w-auto" })}
                                </div>
                            ))}
                        </Marquee>
                    </div>
                </AnimationContainer>

            </div>

            {/* Gradient Background */}
            <AnimationContainer
                animation="scaleUp"
                delay={1.1}
                className="absolute w-[900px] h-[900px] -top-20 left-1/2 -translate-x-1/2 -z-10 opacity-60"
            >
                <Image
                    src="/images/hero-gradient.svg"
                    alt="hero"
                    width={1024}
                    height={1024}
                    className="object-cover w-full h-full"
                />
            </AnimationContainer>

        </Wrapper>

    )
};

export default Hero