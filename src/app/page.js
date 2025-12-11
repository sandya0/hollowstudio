import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Services from "@/components/Services";

export default function Home() {
  
  return (
    <>
      {/* Grid overlay layer */}
      <div className="grid-overlay" />

      <main className="relative">
        <Navbar />
        <Hero />
        <Services />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
