import { AdvisorStartCard } from "@/components/advisor/AdvisorStartCard";
import { HeroSection } from "@/components/advisor/HeroSection";
import { HomeChecks } from "@/components/advisor/HomeChecks";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AdvisorStartCard />
      <HomeChecks />
    </>
  );
}
