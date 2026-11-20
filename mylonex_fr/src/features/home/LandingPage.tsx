import "./styles/landing.css";
import "./styles/landing-polish.css";
import "./styles/scroll-story.css";
import "./styles/loom-intro.css";
import LandingScrollCoordinator from "./motion/LandingScrollCoordinator";
import FabricRibbon from "./FabricRibbon";
import Header from "../../shared/branding/Header";
import LoomIntro from "./LoomIntro";
import LandingHero from "./LandingHero";
import TextileJourney from "./TextileJourney";
import FabricDiscovery from "./FabricDiscovery";
import AISourcingExperience from "./AISourcingExperience";
import MaterialIdentity from "./MaterialIdentity";
import ProductionInfrastructure from "./ProductionInfrastructure";
import FeaturedFabrics from "./FeaturedFabrics";
import FeaturesSection from "./FeaturesSection";
import BrowseReadyStockSection from "./BrowseReadyStockSection";
import Footer from "../../shared/branding/Footer";
import { useEffect, useState } from "react";
import { request } from "../../shared/api";
import { readCurrentAccount, signOut, onSessionChange } from "../../shared/session/auth";
import type { Account } from "../../shared/session/portal-api";
import type { FabricCardItem } from "./FabricCard";

export default function LandingPage() {
  const [user, setUser] = useState<Account | null>(null);
  const [fabrics, setFabrics] = useState<FabricCardItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let signedOut = false;
    const unsubscribe = onSessionChange(event => {
      if (event === "SIGNED_OUT") {
        signedOut = true;
        setUser(null);
      }
    });
    readCurrentAccount(controller.signal).then(account => {
      if (!controller.signal.aborted && !signedOut) setUser(account);
    }).catch(() => {});
    request<{ items: FabricCardItem[] }>("/public/featured-fabrics", { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setFabrics(data.items);
    }).catch(() => {});
    return () => { unsubscribe(); controller.abort(); };
  }, []);

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }
  return (
    <div className="landing-root min-h-screen antialiased flex flex-col">
      <LandingScrollCoordinator />
      <Header user={user} isLanding onSignOut={handleSignOut} />
      
      <main className="flex-1">
        <LoomIntro />
        <LandingHero />
        
        <TextileJourney />

        <FabricDiscovery items={fabrics} />

        <AISourcingExperience fabrics={fabrics} />
        
        <MaterialIdentity fabrics={fabrics} />

        <ProductionInfrastructure />
        
        <FeaturedFabrics items={fabrics} />
        <FeaturesSection />
        <div id="sourcing-finale" className="landing-finale" data-fabric-scene="finale">
          <FabricRibbon variant="finale" />
          <BrowseReadyStockSection />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
