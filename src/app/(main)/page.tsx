import { Navbar } from "@/components/ui/web/navbar";
import { auth } from "@/lib/auth";
import Companies from "@/components/ui/web/trust-companies";
import { headers } from "next/headers";
import CTA from "@/components/ui/web/cta";
import FAQ from "@/components/ui/web/faq";
import Features from "@/components/ui/web/features";
import Hero from "@/components/ui/web/hero";
import HowItWorks from "@/components/ui/web/how-it-works";
import Perks from "@/components/ui/web/perks";
import PlatformMetrics from "@/components/ui/web/platform-metrics";
import Pricing from "@/components/ui/web/pricing";
import Testimonials from "@/components/ui/web/testimonials";

export default async function HomePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <>
            <Navbar user={session?.user} />
            
                <Hero />
            

            
                <Perks />
            

            <section className="w-full">
                <HowItWorks />
            </section>

            <section className="w-full">
                <Features />
            </section>

            <section className="w-full">
                <Testimonials />
            </section>

            <section className="w-full">
                <Pricing />
            </section>

            <section className="w-full">
                <PlatformMetrics />
            </section>

            <section className="w-full">
                <FAQ />
            </section>

            <section className="w-full">
                <CTA />
            </section>
        </>
    );
}