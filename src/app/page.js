import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Services from "@/components/Services";
import Works from "@/components/Works";
import FluidAnimation from "@/components/FluidAnimation";

export default function Home() {
  
  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <FluidAnimation />
      </div>
      {/* Grid overlay layer */}
      {/* <div className="grid-overlay" /> */}

      <main className="relative">
        <Navbar />
        <Hero />
        <Services />
        <Works />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
