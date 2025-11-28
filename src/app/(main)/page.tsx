import { Navbar } from "@/components/ui/web/navbar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import CTA from "@/components/ui/web/cta";
import FAQ from "@/components/ui/web/faq";
import Footer from "@/components/ui/web/footer";
import Features from "@/components/ui/web/features";
import Hero from "@/components/ui/web/hero";
import Pricing from "@/components/ui/web/pricing";

export default async function HomePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <>
            <Navbar user={session?.user} />

            <Hero />



            {/* <section className="w-full">
                <HowItWorks />
            </section> */}

            <section className="w-full">
                <Features />
            </section>

            {/* <section className="w-full">
                <Testimonials />
            </section> */}

            <section className="w-full">
                <Pricing />
            </section>

            {/* <section className="w-full">
                <PlatformMetrics />
            </section> */}

            <section className="w-full">
                <FAQ />
            </section>

            <section className="w-full">
                <CTA />
            </section>
            <Footer/>
        </>
    );
}