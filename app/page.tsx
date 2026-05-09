import { SiteHeaderAlt as SiteHeader } from "@/components/landing/SiteHeader";
import { QuoteSection } from "@/components/landing/QuoteSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

// FloatingTopBar lives in app/layout.tsx OUTSIDE the ScrollSmoother
// wrapper so position:fixed resolves against the viewport instead of
// the transformed smooth-content element.
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
