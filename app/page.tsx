import {
  FloatingTopBar,
  SiteHeaderAlt as SiteHeader,
} from "@/components/landing/SiteHeader";
import { QuoteSection } from "@/components/landing/QuoteSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { WaitlistSection } from "@/components/landing/WaitlistSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function Home() {
  return (
    <>
      <FloatingTopBar />
      <SiteHeader />
      <QuoteSection />
      <StepsSection />
      <WaitlistSection />
      <SiteFooter />
    </>
  );
}
