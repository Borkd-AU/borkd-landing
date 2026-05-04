import { SiteHeaderAlt as SiteHeader } from "@/components/landing/SiteHeader";
import { QuoteSection } from "@/components/landing/QuoteSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <QuoteSection />
      <StepsSection />
      <SiteFooter />
    </>
  );
}
